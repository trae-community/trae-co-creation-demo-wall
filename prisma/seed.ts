import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { countryCityItems } from '../docs/seed-data-countries';

const prisma = new PrismaClient();

/**
 * 数据库种子脚本
 * 
 * 用途：初始化系统基础数据和核心业务字典
 * - 系统角色（root, admin, common）
 * - 核心业务字典（审核状态、开发状态、作品分类、荣誉类型）
 * - 省份城市数据（从导出文件导入，数据量较大）
 * - 默认管理员账号（trae / trae1234）
 * 
 * 执行时机：
 * - Docker 部署：entrypoint.sh 自动执行一次（RUN_DB_INIT=true）
 * - 本地开发：手动运行 npm run db:seed
 * - 安全保证：使用幂等操作，可重复执行
 */

// ========================================
// 核心业务字典定义（硬编码，便于代码审查）
// ========================================

const ROLES = [
  { roleCode: 'root', roleName: '根用户', description: '系统最高权限' },
  { roleCode: 'admin', roleName: '管理员', description: '平台运营管理' },
  { roleCode: 'common', roleName: '普通角色', description: '普通用户' },
];

const SYSTEM_DICTS = [
  { dictCode: 'audit_status', dictName: '审核状态', description: '作品审核流程状态', isSystem: true },
  { dictCode: 'dev_status', dictName: '开发状态', description: '作品当前的开发阶段', isSystem: true },
  { dictCode: 'category_code', dictName: '作品分类', description: '作品所属的类别', isSystem: true },
  { dictCode: 'honor_type', dictName: '荣誉类型', description: '作品获得的荣誉类型', isSystem: true },
];

const AUDIT_STATUS_ITEMS = [
  { itemLabel: '待审核', itemValue: '0', sortOrder: 0 },
  { itemLabel: '已通过', itemValue: '1', sortOrder: 1 },
  { itemLabel: '已拒绝', itemValue: '2', sortOrder: 2 },
];

const DEV_STATUS_ITEMS = [
  { itemLabel: '创意构思', itemValue: 'ideation', sortOrder: 0 },
  { itemLabel: '初步原型', itemValue: 'prototype', sortOrder: 1 },
  { itemLabel: '功能完成', itemValue: 'completed', sortOrder: 2 },
  { itemLabel: '已可体验', itemValue: 'released', sortOrder: 3 },
];

const CATEGORY_ITEMS = [
  { itemLabel: '实用工具', itemValue: 'utility', sortOrder: 5 },
  { itemLabel: '场景应用', itemValue: 'scenario', sortOrder: 6 },
  { itemLabel: '智能助手', itemValue: 'assistant', sortOrder: 7 },
  { itemLabel: '内容创作', itemValue: 'content', sortOrder: 8 },
  { itemLabel: '创意实验', itemValue: 'creative', sortOrder: 9 },
  { itemLabel: '其他类型', itemValue: 'other', sortOrder: 10 },
];

const HONOR_TYPE_ITEMS = [
  { itemLabel: '社区精选', itemValue: 'community_choice', sortOrder: 0 },
  { itemLabel: '城市人气', itemValue: 'city_star', sortOrder: 1 },
  { itemLabel: '城市推荐', itemValue: 'best_of_year', sortOrder: 2 },
];

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🌱 数据库种子数据初始化开始');
  console.log('='.repeat(60));
  console.log(`⏰ 执行时间: ${new Date().toISOString()}\n`);

  // ========================================
  // 1. 初始化系统角色
  // ========================================
  console.log('\n📋 步骤 1: 初始化系统角色...');

  const roleStats = { created: 0, skipped: 0 };
  let rootRole = await prisma.sysRole.findUnique({ where: { roleCode: 'root' } });
  let adminRole = await prisma.sysRole.findUnique({ where: { roleCode: 'admin' } });
  let commonRole = await prisma.sysRole.findUnique({ where: { roleCode: 'common' } });

  for (const roleData of ROLES) {
    const existing = await prisma.sysRole.findUnique({
      where: { roleCode: roleData.roleCode },
      select: { id: true },
    });

    if (existing) {
      roleStats.skipped++;
      console.log(`  ⏭️  跳过（已存在）: ${roleData.roleName} (${roleData.roleCode})`);
    } else {
      const role = await prisma.sysRole.create({ data: roleData });
      roleStats.created++;
      console.log(`  ✅ 创建成功: ${role.roleName} (${role.roleCode})`);
    }

    if (roleData.roleCode === 'root') rootRole = await prisma.sysRole.findUnique({ where: { roleCode: 'root' } });
    if (roleData.roleCode === 'admin') adminRole = await prisma.sysRole.findUnique({ where: { roleCode: 'admin' } });
    if (roleData.roleCode === 'common') commonRole = await prisma.sysRole.findUnique({ where: { roleCode: 'common' } });
  }

  console.log(`  📊 角色统计: ${roleStats.created} 条新建, ${roleStats.skipped} 条跳过\n`);

  // ========================================
  // 2. 初始化核心业务字典（硬编码）
  // ========================================
  console.log('\n📋 步骤 2: 初始化核心业务字典...');

  const dictStats = { created: 0, skipped: 0 };

  for (const dictData of SYSTEM_DICTS) {
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
  // 3. 初始化核心字典项（硬编码）
  // ========================================
  console.log('\n📋 步骤 3: 初始化核心字典项...');

  const itemStats = { created: 0, skipped: 0 };

  // 审核状态
  for (const item of AUDIT_STATUS_ITEMS) {
    await addItem('audit_status', item, itemStats);
  }
  console.log(`  ✅ 审核状态: ${AUDIT_STATUS_ITEMS.length} 条`);

  // 开发状态
  for (const item of DEV_STATUS_ITEMS) {
    await addItem('dev_status', item, itemStats);
  }
  console.log(`  ✅ 开发状态: ${DEV_STATUS_ITEMS.length} 条`);

  // 作品分类
  for (const item of CATEGORY_ITEMS) {
    await addItem('category_code', item, itemStats);
  }
  console.log(`  ✅ 作品分类: ${CATEGORY_ITEMS.length} 条`);

  // 荣誉类型
  for (const item of HONOR_TYPE_ITEMS) {
    await addItem('honor_type', item, itemStats);
  }
  console.log(`  ✅ 荣誉类型: ${HONOR_TYPE_ITEMS.length} 条\n`);

  // ========================================
  // 4. 初始化省份城市数据（从导出文件）
  // ========================================
  console.log('\n📋 步骤 4: 初始化省份城市数据...');
  console.log('  💡 提示：此部分数据量较大（400+ 条），从导出文件导入\n');

  try {
    // 创建省份和城市字典
    const [countryDict, cityDict] = await Promise.all([
      prisma.sysDict.upsert({
        where: { dictCode: 'country' },
        update: {},
        create: { dictCode: 'country', dictName: '省份', description: '省份列表', isSystem: true },
      }),
      prisma.sysDict.upsert({
        where: { dictCode: 'city' },
        update: {},
        create: { dictCode: 'city', dictName: '城市', description: '城市列表', isSystem: true },
      }),
    ]);

    console.log(`  ✅ 省份/城市字典已就绪`);

    // 批量创建省份和城市数据
    let countryCount = 0;
    let cityCount = 0;

    for (const item of countryCityItems) {
      const existing = await prisma.sysDictItem.findUnique({
        where: { 
          dictCode_itemValue: {
            dictCode: item.dictCode,
            itemValue: item.itemValue,
          }
        },
        select: { id: true },
      });

      if (!existing) {
        await prisma.sysDictItem.create({ data: item });
        if (item.dictCode === 'country') countryCount++;
        else cityCount++;
      }
    }

    console.log(`  📊 省份数据: ${countryCount} 条新建`);
    console.log(`  📊 城市数据: ${cityCount} 条新建\n`);
  } catch (error) {
    console.log('  ⚠️  省份城市数据未找到导出文件，将使用空字典\n');
    console.error(error);
  }

  // ========================================
  // 5. 初始化默认管理员账号
  // ========================================
  console.log('\n📋 步骤 5: 初始化默认管理员账号...');

  const adminUsername = 'trae';
  const adminEmail = 'trae@example.com';
  const adminPassword = 'trae1234';

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
  // 6. 分配 root 角色给管理员
  // ========================================
  console.log('\n📋 步骤 6: 分配 root 角色...');

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
  // 完成摘要
  // ========================================
  console.log('\n' + '='.repeat(60));
  console.log('✅ 数据库初始化完成！');
  console.log('='.repeat(60));
  
  console.log('\n📝 执行摘要:');
  console.log(`  • 角色: ${rootRole ? '✅' : '❌'} root 用户已就绪`);
  console.log(`  • 核心字典: ✅ ${SYSTEM_DICTS.length} 个字典类型已就绪`);
  console.log(`  • 核心字典项: ✅ ${AUDIT_STATUS_ITEMS.length + DEV_STATUS_ITEMS.length + CATEGORY_ITEMS.length + HONOR_TYPE_ITEMS.length} 条记录已就绪`);
  console.log(`  • 管理员: ✅ ${adminUser.email} (${rootRole ? rootRole.roleName : 'N/A'})`);
  
  console.log('\n🔐 登录信息:');
  console.log(`   用户名: ${adminUsername}`);
  console.log(`   密码: ${adminPassword}`);
  console.log(`   邮箱: ${adminEmail}`);
  if (rootRole) {
    console.log(`   角色: ${rootRole.roleName} (${rootRole.roleCode})`);
  }
  console.log('='.repeat(60) + '\n');
}

// 辅助函数：添加字典项
async function addItem(
  dictCode: string,
  item: { itemLabel: string; itemValue: string; sortOrder: number },
  stats: { created: number; skipped: number }
) {
  const existing = await prisma.sysDictItem.findUnique({
    where: { 
      dictCode_itemValue: {
        dictCode,
        itemValue: item.itemValue,
      }
    },
    select: { id: true },
  });

  if (existing) {
    stats.skipped++;
  } else {
    await prisma.sysDictItem.create({
      data: {
        dictCode,
        itemLabel: item.itemLabel,
        itemValue: item.itemValue,
        sortOrder: item.sortOrder,
        status: true,
      },
    });
    stats.created++;
  }
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
