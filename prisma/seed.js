const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEMO_WORKS = [
  { title: '智能垃圾分类助手', summary: '基于计算机视觉的垃圾自动分类系统', cityCode: '上海', countryCode: '中国', categoryCode: '智能助手' },
  { title: '社区互助养老平台', summary: '连接社区老年人与志愿者的服务平台', cityCode: '北京', countryCode: '中国', categoryCode: '场景应用' },
  { title: 'VR虚拟博物馆', summary: '足不出户游览世界名馆', cityCode: '杭州', countryCode: '中国', categoryCode: '创意实验' },
  { title: '智慧农业监测系统', summary: '实时监控农田环境数据', cityCode: '成都', countryCode: '中国', categoryCode: '场景应用' },
  { title: '校园二手交易集市', summary: '打造安全便捷的校园闲置物品流转平台', cityCode: '广州', countryCode: '中国', categoryCode: '场景应用' },
];

async function main() {
  const role = await prisma.sysRole.upsert({
    where: { roleCode: 'common' },
    update: {},
    create: { roleCode: 'common', roleName: '普通用户' },
  });

  let seedUser = await prisma.sysUser.findFirst({
    where: { clerkId: 'seed-demo-works' },
  });
  if (!seedUser) {
    seedUser = await prisma.sysUser.create({
      data: {
        clerkId: 'seed-demo-works',
        email: 'seed@demo.local',
        username: 'seed-demo',
      },
    });
    await prisma.sysUserRole.upsert({
      where: { userId_roleId: { userId: seedUser.id, roleId: role.id } },
      update: {},
      create: { userId: seedUser.id, roleId: role.id },
    });
  }

  const count = await prisma.workBase.count();
  if (count >= 5) {
    console.log('Works already seeded, skip.');
    return;
  }

  for (const w of DEMO_WORKS) {
    const work = await prisma.workBase.create({
      data: {
        userId: seedUser.id,
        title: w.title,
        summary: w.summary,
        cityCode: w.cityCode,
        countryCode: w.countryCode,
        categoryCode: w.categoryCode,
      },
    });
    await prisma.workStatistic.create({
      data: {
        workId: work.id,
        viewCount: 0,
        likeCount: 0,
        auditStatus: 1,
        displayStatus: 1,
      },
    });
    console.log('Created work', work.id.toString(), w.title);
  }
  console.log('Seed done: 5 works + statistics.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
