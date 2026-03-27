import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function escapeLiteral(value: string) {
  return value.replace(/'/g, "''");
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

async function resetTableSequence(tableName: string) {
  const escapedTableName = escapeLiteral(tableName);
  const sequenceColumnRows = await prisma.$queryRawUnsafe<Array<{ column_name: string | null }>>(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = '${escapedTableName}'
        AND column_default LIKE 'nextval(%'
      LIMIT 1
    `,
  );

  const sequenceColumn = sequenceColumnRows[0]?.column_name;

  if (!sequenceColumn) {
    return;
  }

  const escapedSequenceColumn = escapeLiteral(sequenceColumn);
  const sequenceRows = await prisma.$queryRawUnsafe<Array<{ sequence_name: string | null }>>(
    `SELECT pg_get_serial_sequence('"${tableName}"', '${escapedSequenceColumn}') AS sequence_name`,
  );

  const sequenceName = sequenceRows[0]?.sequence_name;

  if (!sequenceName) {
    return;
  }

  const maxIdRows = await prisma.$queryRawUnsafe<Array<{ max_id: bigint | number | null }>>(
    `SELECT MAX(${quoteIdentifier(sequenceColumn)}) AS max_id FROM ${quoteIdentifier(tableName)}`,
  );

  const maxId = maxIdRows[0]?.max_id;

  if (maxId === null || maxId === undefined) {
    await prisma.$executeRawUnsafe(
      `SELECT setval('${sequenceName.replace(/'/g, "''")}', 1, false)`,
    );
    return;
  }

  await prisma.$executeRawUnsafe(
    `SELECT setval('${sequenceName.replace(/'/g, "''")}', ${maxId.toString()}, true)`,
  );
}

async function main() {
  const backupDir = path.join(process.cwd(), 'supabase_backup');

  console.log('Starting database seed...');

  // 读取并导入数据的顺序很重要（外键依赖）
  const tables = [
    'sys_dict',
    'sys_dict_item',
    'sys_role',
    'sys_user',
    'sys_user_role',
    'sys_auth_log',
    'sys_operation_log',
    'work_tag',
    'work_base',
    'work_detail',
    'work_image',
    'work_team',
    'work_honor',
    'work_statistic',
    'work_tag_relation',
    'work_like',
    'work_audit_log',
  ];

  for (const table of tables) {
    const filePath = path.join(backupDir, `${table}.json`);

    if (!fs.existsSync(filePath)) {
      console.log(`Skipping ${table} - file not found`);
      continue;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (!data || data.length === 0) {
      console.log(`Skipping ${table} - no data`);
      continue;
    }

    console.log(`Importing ${data.length} records into ${table}...`);

    // 使用 Prisma 的原始查询来插入数据
    const tableName = table;
    const keys = Object.keys(data[0]);

    for (const record of data) {
      const values = keys.map(key => {
        const value = record[key];
        if (value === null || value === undefined) return 'NULL';
        if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        if (typeof value === 'number') return value;
        if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
        return value;
      });

      const sql = `INSERT INTO "${tableName}" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING`;

      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (error) {
        console.error(`Error inserting into ${table}:`, error);
      }
    }

    console.log(`✓ Completed ${table}`);
  }

  console.log('Resetting imported table sequences...');

  for (const table of tables) {
    await resetTableSequence(table);
  }

  // 初始化默认管理员账号
  console.log('Initializing default admin user...');

  const adminEmail = 'traedemo@example.com';
  const adminPassword = 'traedemo123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.sysUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      username: 'traedemo',
      passwordHash: hashedPassword,
    },
  });

  console.log(`✓ Admin user created: ${adminUser.email}`);

  // 分配根用户角色，需与备份数据和前端权限判断保持一致
  const adminRole = await prisma.sysRole.upsert({
    where: { roleCode: 'root' },
    update: {},
    create: {
      roleCode: 'root',
      roleName: '根用户',
      description: '系统最高权限用户',
    },
  });

  await prisma.sysUserRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  console.log(`✓ Admin role assigned: ${adminRole.roleName}`);

  console.log('Database seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
