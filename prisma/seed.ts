import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { roles, dicts, dictItems } from '../docs/seed-data';

const prisma = new PrismaClient();

/**
 * 数据库种子脚本
 * 
 * 用途：初始化系统基础数据
 * - 系统角色（root, admin, common）
 * - 字典表（审核状态、开发状态、分类等）
 * - 字典项（从数据库导出的实际数据）
 * - 默认管理员账号（trae / trae1234）
 * 
 * 数据来源：
 * - 角色、字典、字典项数据从 docs/seed-data.ts 导入
 * - seed-data.ts 由 _temp_export_seed.js 脚本从数据库导出
 * 
 * 执行时机：
 * - Docker 部署：entrypoint.sh 自动执行一次（RUN_DB_INIT=true）
 * - 本地开发：手动运行 npm run db:seed
 * - 安全保证：使用 upsert 操作，可重复执行
 */

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🌱 数据库种子数据初始化开始');
  console.log('='.repeat(60));
  console.log(`⏰ 执行时间: ${new Date().toISOString()}\n`);

  // ========================================
  // 1. 初始化系统角色（从数据库导出）
  // ========================================
  console.log('\n📋 步骤 1: 初始化系统角色...');

  let rootRole: Awaited<ReturnType<typeof prisma.sysRole.upsert>> | null = null;
  let adminRole: Awaited<ReturnType<typeof prisma.sysRole.upsert>> | null = null;
  let commonRole: Awaited<ReturnType<typeof prisma.sysRole.upsert>> | null = null;

  const roleStats = { created: 0, updated: 0, skipped: 0 };

  for (const roleData of roles) {
    // 检查是否已存在
    const existing = await prisma.sysRole.findUnique({
      where: { roleCode: roleData.roleCode },
      select: { id: true },
    });

    if (existing) {
      // 已存在的内置角色，跳过创建（不更新，保持配置不变）
      roleStats.skipped++;
      console.log(`  ⏭️  跳过（已存在）: ${roleData.roleName} (${roleData.roleCode})`);
    } else {
      // 新建角色
      const role = await prisma.sysRole.create({
        data: roleData,
      });
      roleStats.created++;
      console.log(`  ✅ 创建成功: ${role.roleName} (${role.roleCode})`);
    }

    if (roleData.roleCode === 'root') rootRole = await prisma.sysRole.findUnique({ where: { roleCode: 'root' } });
    if (roleData.roleCode === 'admin') adminRole = await prisma.sysRole.findUnique({ where: { roleCode: 'admin' } });
    if (roleData.roleCode === 'common') commonRole = await prisma.sysRole.findUnique({ where: { roleCode: 'common' } });
  }

  // ========================================
  // 2. 初始化字典表（从数据库导出）
  // ========================================
  console.log('\n📋 步骤 2: 初始化字典表...');

  const dictStats = { created: 0, skipped: 0 };

  for (const dictData of dicts) {
    const existing = await prisma.sysDict.findUnique({
      where: { dictCode: dictData.dictCode },
      select: { id: true },
    });

    if (existing) {
      dictStats.skipped++;
      console.log(`  ⏭️  跳过（已存在）: ${dictData.dictName} (${dictData.dictCode})`);
    } else {
      await prisma.sysDict.create({ data: dictData });
      dictStats.created++;
      console.log(`  ✅ 创建成功: ${dictData.dictName} (${dictData.dictCode})`);
    }
  }
  
  console.log(`  📊 字典统计: ${dictStats.created} 条新建, ${dictStats.skipped} 条跳过\n`);

  // ========================================
  // 3. 初始化字典项（从数据库导出）
  // ========================================
  console.log('\n📋 步骤 3: 初始化字典项...');

  const itemStats = { created: 0, skipped: 0 };

  for (const itemData of dictItems) {
    const existing = await prisma.sysDictItem.findUnique({
      where: { 
        dictCode_itemValue: {
          dictCode: itemData.dictCode,
          itemValue: itemData.itemValue,
        }
      },
      select: { id: true },
    });

    if (existing) {
      itemStats.skipped++;
    } else {
      await prisma.sysDictItem.create({ data: itemData });
      itemStats.created++;
    }
  }
  
  console.log(`  📊 字典项统计: ${itemStats.created} 条新建, ${itemStats.skipped} 条跳过 (共 ${dictItems.length} 条)\n`);

  // ========================================
  // 4. 初始化默认管理员账号
  // ========================================
  console.log('\n📋 步骤 4: 初始化默认管理员账号...');

  const adminUsername = 'trae';
  const adminEmail = 'trae@example.com';
  const adminPassword = 'trae1234';

  // 检查用户是否已存在
  const existingUser = await prisma.sysUser.findUnique({
    where: { email: adminEmail },
    select: { id: true, username: true },
  });

  let adminUser;
  let userAction = '';

  if (existingUser) {
    // 用户已存在，更新密码（防止密码泄露后无法登录）
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    adminUser = await prisma.sysUser.update({
      where: { id: existingUser.id },
      data: { 
        username: adminUsername,
        passwordHash: hashedPassword,
      },
    });
    userAction = '🔄 已更新';
    console.log(`  ${userAction}: ${adminUser.email}`);
  } else {
    // 新用户
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    adminUser = await prisma.sysUser.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        passwordHash: hashedPassword,
      },
    });
    userAction = '✅ 已创建';
    console.log(`  ${userAction}: ${adminUser.email}`);
  }

  // ========================================
  // 5. 分配 root 角色给管理员
  // ========================================
  console.log('\n📋 步骤 5: 分配 root 角色...');

  if (!rootRole) {
    throw new Error('❌ Root role not found. Please ensure step 1 completed successfully.');
  }

  // 检查关联是否已存在
  const existingRelation = await prisma.sysUserRole.findUnique({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: rootRole.id,
      },
    },
  });

  if (!existingRelation) {
    await prisma.sysUserRole.create({
      data: {
        userId: adminUser.id,
        roleId: rootRole.id,
      },
    });
    console.log(`  ✅ 分配成功: ${rootRole.roleName} (${rootRole.roleCode})`);
  } else {
    console.log(`  ⏭️  跳过（已存在）: ${rootRole.roleName}`);
  }

  // ========================================
  // 完成
  // ========================================
  console.log('\n' + '='.repeat(60));
  console.log('✅ 数据库初始化完成！');
  console.log('='.repeat(60));
  
  console.log('\n📝 执行摘要:');
  console.log(`  • 角色: ${rootRole ? '✅' : '❌'} root 用户已就绪`);
  console.log(`  • 字典: ✅ ${dicts.length} 个字典类型已就绪`);
  console.log(`  • 字典项: ✅ ${dictItems.length} 条记录已就绪`);
  console.log(`  • 管理员: ✅ ${adminUser.email} (${rootRole?.roleName})`);
  
  console.log('\n🔐 登录信息:');
  console.log(`   用户名: ${adminUsername}`);
  console.log(`   密码: ${adminPassword}`);
  console.log(`   邮箱: ${adminEmail}`);
  console.log(`   角色: ${rootRole?.roleName} (${rootRole?.roleCode})`);
  console.log('\n' + '='.repeat(60) + '\n');
}

// 执行初始化
main()
  .catch((e) => {
    console.error('❌ 初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
