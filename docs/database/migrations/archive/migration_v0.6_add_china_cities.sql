-- TRAE Demo Wall v0.6 - 城市字典扩展迁移脚本
-- 添加中国所有省级行政区和 344 个城市
-- 执行前请确保 Docker 数据库服务已启动

-- 添加中国所有省份和城市到字典表
-- 保留现有数据，仅添加缺失的数据

-- ========== 添加省份（country字典）==========
INSERT INTO sys_dict_item (dict_code, item_label, item_value, sort_order, status, label_i18n, parent_value)
SELECT * FROM (VALUES
  ('country', '河北', 'HE', 8, true, '{"en-US": "Hebei", "zh-CN": "河北"}'::jsonb, null),
  ('country', '山西', 'SX', 15, true, '{"en-US": "Shanxi", "zh-CN": "山西"}'::jsonb, null),
  ('country', '辽宁', 'LN', 13, true, '{"en-US": "Liaoning", "zh-CN": "辽宁"}'::jsonb, null),
  ('country', '吉林', 'JL', 12, true, '{"en-US": "Jilin", "zh-CN": "吉林"}'::jsonb, null),
  ('country', '黑龙江', 'HL', 20, true, '{"en-US": "Heilongjiang", "zh-CN": "黑龙江"}'::jsonb, null),
  ('country', '江苏', 'JS', 11, true, '{"en-US": "Jiangsu", "zh-CN": "江苏"}'::jsonb, null),
  ('country', '浙江', 'ZJ', 22, true, '{"en-US": "Zhejiang", "zh-CN": "浙江"}'::jsonb, null),
  ('country', '安徽', 'AH', 0, true, '{"en-US": "Anhui", "zh-CN": "安徽"}'::jsonb, null),
  ('country', '福建', 'FJ', 3, true, '{"en-US": "Fujian", "zh-CN": "福建"}'::jsonb, null),
  ('country', '江西', 'JX', 23, true, '{"en-US": "Jiangxi", "zh-CN": "江西"}'::jsonb, null),
  ('country', '山东', 'SD', 14, true, '{"en-US": "Shandong", "zh-CN": "山东"}'::jsonb, null),
  ('country', '河南', 'HA', 9, true, '{"en-US": "Henan", "zh-CN": "河南"}'::jsonb, null),
  ('country', '湖北', 'HB', 10, true, '{"en-US": "Hubei", "zh-CN": "湖北"}'::jsonb, null),
  ('country', '湖南', 'HN', 24, true, '{"en-US": "Hunan", "zh-CN": "湖南"}'::jsonb, null),
  ('country', '广东', 'GD', 5, true, '{"en-US": "Guangdong", "zh-CN": "广东"}'::jsonb, null),
  ('country', '海南', 'HI', 25, true, '{"en-US": "Hainan", "zh-CN": "海南"}'::jsonb, null),
  ('country', '四川', 'SC', 18, true, '{"en-US": "Sichuan", "zh-CN": "四川"}'::jsonb, null),
  ('country', '贵州', 'GZ', 7, true, '{"en-US": "Guizhou", "zh-CN": "贵州"}'::jsonb, null),
  ('country', '云南', 'YN', 21, true, '{"en-US": "Yunnan", "zh-CN": "云南"}'::jsonb, null),
  ('country', '陕西', 'SN', 16, true, '{"en-US": "Shaanxi", "zh-CN": "陕西"}'::jsonb, null),
  ('country', '甘肃', 'GS', 4, true, '{"en-US": "Gansu", "zh-CN": "甘肃"}'::jsonb, null),
  ('country', '青海', 'QH', 26, true, '{"en-US": "Qinghai", "zh-CN": "青海"}'::jsonb, null),
  ('country', '台湾', 'TW', 27, true, '{"en-US": "Taiwan", "zh-CN": "台湾"}'::jsonb, null),
  ('country', '内蒙古', 'NM', 28, true, '{"en-US": "Inner Mongolia", "zh-CN": "内蒙古"}'::jsonb, null),
  ('country', '广西', 'GX', 6, true, '{"en-US": "Guangxi", "zh-CN": "广西"}'::jsonb, null),
  ('country', '西藏', 'XZ', 29, true, '{"en-US": "Tibet", "zh-CN": "西藏"}'::jsonb, null),
  ('country', '宁夏', 'NX', 30, true, '{"en-US": "Ningxia", "zh-CN": "宁夏"}'::jsonb, null),
  ('country', '新疆', 'XJ', 20, true, '{"en-US": "Xinjiang", "zh-CN": "新疆"}'::jsonb, null),
  ('country', '香港', 'HK', 31, true, '{"en-US": "Hong Kong", "zh-CN": "香港"}'::jsonb, null),
  ('country', '澳门', 'MO', 32, true, '{"en-US": "Macau", "zh-CN": "澳门"}'::jsonb, null)
) AS v(dict_code, item_label, item_value, sort_order, status, label_i18n, parent_value)
WHERE NOT EXISTS (
  SELECT 1 FROM sys_dict_item WHERE dict_code = v.dict_code AND item_value = v.item_value
);

-- ========== 添加城市（city字典）==========
INSERT INTO sys_dict_item (dict_code, item_label, item_value, sort_order, status, label_i18n, parent_value)
SELECT * FROM (VALUES
  -- 直辖市
  ('city', '天津', '120100', 0, true, '{"en-US": "Tianjin", "zh-CN": "天津"}'::jsonb, 'TJ'),

  -- 河北省
  ('city', '石家庄', '130100', 0, true, '{"en-US": "Shijiazhuang", "zh-CN": "石家庄"}'::jsonb, 'HE'),
  ('city', '唐山', '130200', 1, true, '{"en-US": "Tangshan", "zh-CN": "唐山"}'::jsonb, 'HE'),
  ('city', '秦皇岛', '130300', 2, true, '{"en-US": "Qinhuangdao", "zh-CN": "秦皇岛"}'::jsonb, 'HE'),
  ('city', '邯郸', '130400', 3, true, '{"en-US": "Handan", "zh-CN": "邯郸"}'::jsonb, 'HE'),
  ('city', '邢台', '130500', 4, true, '{"en-US": "Xingtai", "zh-CN": "邢台"}'::jsonb, 'HE'),
  ('city', '保定', '130600', 5, true, '{"en-US": "Baoding", "zh-CN": "保定"}'::jsonb, 'HE'),
  ('city', '张家口', '130700', 6, true, '{"en-US": "Zhangjiakou", "zh-CN": "张家口"}'::jsonb, 'HE'),
  ('city', '承德', '130800', 7, true, '{"en-US": "Chengde", "zh-CN": "承德"}'::jsonb, 'HE'),
  ('city', '沧州', '130900', 8, true, '{"en-US": "Cangzhou", "zh-CN": "沧州"}'::jsonb, 'HE'),
  ('city', '衡水', '131100', 10, true, '{"en-US": "Hengshui", "zh-CN": "衡水"}'::jsonb, 'HE'),

  -- 山西省
  ('city', '太原', '140100', 0, true, '{"en-US": "Taiyuan", "zh-CN": "太原"}'::jsonb, 'SX'),
  ('city', '大同', '140200', 1, true, '{"en-US": "Datong", "zh-CN": "大同"}'::jsonb, 'SX'),
  ('city', '阳泉', '140300', 2, true, '{"en-US": "Yangquan", "zh-CN": "阳泉"}'::jsonb, 'SX'),
  ('city', '长治', '140400', 3, true, '{"en-US": "Changzhi", "zh-CN": "长治"}'::jsonb, 'SX'),
  ('city', '晋城', '140500', 4, true, '{"en-US": "Jincheng", "zh-CN": "晋城"}'::jsonb, 'SX'),
  ('city', '朔州', '140600', 5, true, '{"en-US": "Shuozhou", "zh-CN": "朔州"}'::jsonb, 'SX'),
  ('city', '晋中', '140700', 6, true, '{"en-US": "Jinzhong", "zh-CN": "晋中"}'::jsonb, 'SX'),
  ('city', '运城', '140800', 7, true, '{"en-US": "Yuncheng", "zh-CN": "运城"}'::jsonb, 'SX'),
  ('city', '忻州', '140900', 8, true, '{"en-US": "Xinzhou", "zh-CN": "忻州"}'::jsonb, 'SX'),
  ('city', '临汾', '141000', 9, true, '{"en-US": "Linfen", "zh-CN": "临汾"}'::jsonb, 'SX'),
  ('city', '吕梁', '141100', 10, true, '{"en-US": "Lvliang", "zh-CN": "吕梁"}'::jsonb, 'SX'),

  -- 辽宁省
  ('city', '沈阳', '210100', 0, true, '{"en-US": "Shenyang", "zh-CN": "沈阳"}'::jsonb, 'LN'),
  ('city', '大连', '210200', 1, true, '{"en-US": "Dalian", "zh-CN": "大连"}'::jsonb, 'LN'),
  ('city', '鞍山', '210300', 2, true, '{"en-US": "Anshan", "zh-CN": "鞍山"}'::jsonb, 'LN'),
  ('city', '抚顺', '210400', 3, true, '{"en-US": "Fushun", "zh-CN": "抚顺"}'::jsonb, 'LN'),
  ('city', '本溪', '210500', 4, true, '{"en-US": "Benxi", "zh-CN": "本溪"}'::jsonb, 'LN'),
  ('city', '丹东', '210600', 5, true, '{"en-US": "Dandong", "zh-CN": "丹东"}'::jsonb, 'LN'),
  ('city', '锦州', '210700', 6, true, '{"en-US": "Jinzhou", "zh-CN": "锦州"}'::jsonb, 'LN'),
  ('city', '营口', '210800', 7, true, '{"en-US": "Yingkou", "zh-CN": "营口"}'::jsonb, 'LN'),
  ('city', '阜新', '210900', 8, true, '{"en-US": "Fuxin", "zh-CN": "阜新"}'::jsonb, 'LN'),
  ('city', '辽阳', '211000', 9, true, '{"en-US": "Liaoyang", "zh-CN": "辽阳"}'::jsonb, 'LN'),
  ('city', '盘锦', '211100', 10, true, '{"en-US": "Panjin", "zh-CN": "盘锦"}'::jsonb, 'LN'),
  ('city', '铁岭', '211200', 11, true, '{"en-US": "Tieling", "zh-CN": "铁岭"}'::jsonb, 'LN'),
  ('city', '朝阳', '211300', 12, true, '{"en-US": "Chaoyang", "zh-CN": "朝阳"}'::jsonb, 'LN'),
  ('city', '葫芦岛', '211400', 13, true, '{"en-US": "Huludao", "zh-CN": "葫芦岛"}'::jsonb, 'LN'),

  -- 吉林省
  ('city', '吉林', '220200', 1, true, '{"en-US": "Jilin", "zh-CN": "吉林"}'::jsonb, 'JL'),
  ('city', '四平', '220300', 2, true, '{"en-US": "Siping", "zh-CN": "四平"}'::jsonb, 'JL'),
  ('city', '辽源', '220400', 3, true, '{"en-US": "Liaoyuan", "zh-CN": "辽源"}'::jsonb, 'JL'),
  ('city', '通化', '220500', 4, true, '{"en-US": "Tonghua", "zh-CN": "通化"}'::jsonb, 'JL'),
  ('city', '白山', '220600', 5, true, '{"en-US": "Baishan", "zh-CN": "白山"}'::jsonb, 'JL'),
  ('city', '松原', '220700', 6, true, '{"en-US": "Songyuan", "zh-CN": "松原"}'::jsonb, 'JL'),
  ('city', '白城', '220800', 7, true, '{"en-US": "Baicheng", "zh-CN": "白城"}'::jsonb, 'JL'),
  ('city', '延边', '222400', 8, true, '{"en-US": "Yanbian", "zh-CN": "延边"}'::jsonb, 'JL'),

  -- 黑龙江省
  ('city', '哈尔滨', '230100', 0, true, '{"en-US": "Harbin", "zh-CN": "哈尔滨"}'::jsonb, 'HL'),
  ('city', '齐齐哈尔', '230200', 1, true, '{"en-US": "Qiqihar", "zh-CN": "齐齐哈尔"}'::jsonb, 'HL'),
  ('city', '鸡西', '230300', 2, true, '{"en-US": "Jixi", "zh-CN": "鸡西"}'::jsonb, 'HL'),
  ('city', '鹤岗', '230400', 3, true, '{"en-US": "Hegang", "zh-CN": "鹤岗"}'::jsonb, 'HL'),
  ('city', '双鸭山', '230500', 4, true, '{"en-US": "Shuangyashan", "zh-CN": "双鸭山"}'::jsonb, 'HL'),
  ('city', '大庆', '230600', 5, true, '{"en-US": "Daqing", "zh-CN": "大庆"}'::jsonb, 'HL'),
  ('city', '伊春', '230700', 6, true, '{"en-US": "Yichun", "zh-CN": "伊春"}'::jsonb, 'HL'),
  ('city', '佳木斯', '230800', 7, true, '{"en-US": "Jiamusi", "zh-CN": "佳木斯"}'::jsonb, 'HL'),
  ('city', '七台河', '230900', 8, true, '{"en-US": "Qitaihe", "zh-CN": "七台河"}'::jsonb, 'HL'),
  ('city', '牡丹江', '231000', 9, true, '{"en-US": "Mudanjiang", "zh-CN": "牡丹江"}'::jsonb, 'HL'),
  ('city', '黑河', '231100', 10, true, '{"en-US": "Heihe", "zh-CN": "黑河"}'::jsonb, 'HL'),
  ('city', '绥化', '231200', 11, true, '{"en-US": "Suihua", "zh-CN": "绥化"}'::jsonb, 'HL'),
  ('city', '大兴安岭', '232700', 12, true, '{"en-US": "Daxinganling", "zh-CN": "大兴安岭"}'::jsonb, 'HL'),

  -- 江苏省
  ('city', '无锡', '320200', 1, true, '{"en-US": "Wuxi", "zh-CN": "无锡"}'::jsonb, 'JS'),
  ('city', '徐州', '320300', 2, true, '{"en-US": "Xuzhou", "zh-CN": "徐州"}'::jsonb, 'JS'),
  ('city', '常州', '320400', 3, true, '{"en-US": "Changzhou", "zh-CN": "常州"}'::jsonb, 'JS'),
  ('city', '连云港', '320700', 6, true, '{"en-US": "Lianyungang", "zh-CN": "连云港"}'::jsonb, 'JS'),
  ('city', '淮安', '320800', 7, true, '{"en-US": "Huai''an", "zh-CN": "淮安"}'::jsonb, 'JS'),
  ('city', '盐城', '320900', 8, true, '{"en-US": "Yancheng", "zh-CN": "盐城"}'::jsonb, 'JS'),
  ('city', '扬州', '321000', 9, true, '{"en-US": "Yangzhou", "zh-CN": "扬州"}'::jsonb, 'JS'),
  ('city', '镇江', '321100', 10, true, '{"en-US": "Zhenjiang", "zh-CN": "镇江"}'::jsonb, 'JS'),
  ('city', '泰州', '321200', 11, true, '{"en-US": "Taizhou", "zh-CN": "泰州"}'::jsonb, 'JS'),
  ('city', '宿迁', '321300', 12, true, '{"en-US": "Suqian", "zh-CN": "宿迁"}'::jsonb, 'JS'),

  -- 浙江省
  ('city', '嘉兴', '330400', 3, true, '{"en-US": "Jiaxing", "zh-CN": "嘉兴"}'::jsonb, 'ZJ'),
  ('city', '绍兴', '330600', 5, true, '{"en-US": "Shaoxing", "zh-CN": "绍兴"}'::jsonb, 'ZJ'),
  ('city', '衢州', '330800', 7, true, '{"en-US": "Quzhou", "zh-CN": "衢州"}'::jsonb, 'ZJ'),
  ('city', '舟山', '330900', 8, true, '{"en-US": "Zhoushan", "zh-CN": "舟山"}'::jsonb, 'ZJ'),
  ('city', '台州', '331000', 9, true, '{"en-US": "Taizhou", "zh-CN": "台州"}'::jsonb, 'ZJ'),
  ('city', '丽水', '331100', 10, true, '{"en-US": "Lishui", "zh-CN": "丽水"}'::jsonb, 'ZJ'),

  -- 安徽省
  ('city', '芜湖', '340200', 1, true, '{"en-US": "Wuhu", "zh-CN": "芜湖"}'::jsonb, 'AH'),
  ('city', '蚌埠', '340300', 2, true, '{"en-US": "Bengbu", "zh-CN": "蚌埠"}'::jsonb, 'AH'),
  ('city', '淮南', '340400', 3, true, '{"en-US": "Huainan", "zh-CN": "淮南"}'::jsonb, 'AH'),
  ('city', '马鞍山', '340500', 4, true, '{"en-US": "Ma''anshan", "zh-CN": "马鞍山"}'::jsonb, 'AH'),
  ('city', '淮北', '340600', 5, true, '{"en-US": "Huaibei", "zh-CN": "淮北"}'::jsonb, 'AH'),
  ('city', '铜陵', '340700', 6, true, '{"en-US": "Tongling", "zh-CN": "铜陵"}'::jsonb, 'AH'),
  ('city', '安庆', '340800', 7, true, '{"en-US": "Anqing", "zh-CN": "安庆"}'::jsonb, 'AH'),
  ('city', '黄山', '341000', 8, true, '{"en-US": "Huangshan", "zh-CN": "黄山"}'::jsonb, 'AH'),
  ('city', '滁州', '341100', 9, true, '{"en-US": "Chuzhou", "zh-CN": "滁州"}'::jsonb, 'AH'),
  ('city', '阜阳', '341200', 10, true, '{"en-US": "Fuyang", "zh-CN": "阜阳"}'::jsonb, 'AH'),
  ('city', '宿州', '341300', 11, true, '{"en-US": "Suzhou", "zh-CN": "宿州"}'::jsonb, 'AH'),
  ('city', '六安', '341500', 12, true, '{"en-US": "Lu''an", "zh-CN": "六安"}'::jsonb, 'AH'),
  ('city', '亳州', '341600', 13, true, '{"en-US": "Bozhou", "zh-CN": "亳州"}'::jsonb, 'AH'),
  ('city', '池州', '341700', 14, true, '{"en-US": "Chizhou", "zh-CN": "池州"}'::jsonb, 'AH'),
  ('city', '宣城', '341800', 15, true, '{"en-US": "Xuancheng", "zh-CN": "宣城"}'::jsonb, 'AH'),

  -- 福建省
  ('city', '莆田', '350300', 2, true, '{"en-US": "Putian", "zh-CN": "莆田"}'::jsonb, 'FJ'),
  ('city', '三明', '350400', 3, true, '{"en-US": "Sanming", "zh-CN": "三明"}'::jsonb, 'FJ'),
  ('city', '漳州', '350600', 5, true, '{"en-US": "Zhangzhou", "zh-CN": "漳州"}'::jsonb, 'FJ'),
  ('city', '南平', '350700', 6, true, '{"en-US": "Nanping", "zh-CN": "南平"}'::jsonb, 'FJ'),
  ('city', '龙岩', '350800', 7, true, '{"en-US": "Longyan", "zh-CN": "龙岩"}'::jsonb, 'FJ'),
  ('city', '宁德', '350900', 8, true, '{"en-US": "Ningde", "zh-CN": "宁德"}'::jsonb, 'FJ'),

  -- 江西省
  ('city', '南昌', '360100', 0, true, '{"en-US": "Nanchang", "zh-CN": "南昌"}'::jsonb, 'JX'),
  ('city', '景德镇', '360200', 1, true, '{"en-US": "Jingdezhen", "zh-CN": "景德镇"}'::jsonb, 'JX'),
  ('city', '萍乡', '360300', 2, true, '{"en-US": "Pingxiang", "zh-CN": "萍乡"}'::jsonb, 'JX'),
  ('city', '九江', '360400', 3, true, '{"en-US": "Jiujiang", "zh-CN": "九江"}'::jsonb, 'JX'),
  ('city', '新余', '360500', 4, true, '{"en-US": "Xinyu", "zh-CN": "新余"}'::jsonb, 'JX'),
  ('city', '鹰潭', '360600', 5, true, '{"en-US": "Yingtan", "zh-CN": "鹰潭"}'::jsonb, 'JX'),
  ('city', '赣州', '360700', 6, true, '{"en-US": "Ganzhou", "zh-CN": "赣州"}'::jsonb, 'JX'),
  ('city', '吉安', '360800', 7, true, '{"en-US": "Ji''an", "zh-CN": "吉安"}'::jsonb, 'JX'),
  ('city', '宜春', '360900', 8, true, '{"en-US": "Yichun", "zh-CN": "宜春"}'::jsonb, 'JX'),
  ('city', '抚州', '361000', 9, true, '{"en-US": "Fuzhou", "zh-CN": "抚州"}'::jsonb, 'JX'),
  ('city', '上饶', '361100', 10, true, '{"en-US": "Shangrao", "zh-CN": "上饶"}'::jsonb, 'JX'),

  -- 山东省
  ('city', '枣庄', '370400', 3, true, '{"en-US": "Zaozhuang", "zh-CN": "枣庄"}'::jsonb, 'SD'),
  ('city', '东营', '370500', 4, true, '{"en-US": "Dongying", "zh-CN": "东营"}'::jsonb, 'SD'),
  ('city', '潍坊', '370700', 6, true, '{"en-US": "Weifang", "zh-CN": "潍坊"}'::jsonb, 'SD'),
  ('city', '威海', '371000', 9, true, '{"en-US": "Weihai", "zh-CN": "威海"}'::jsonb, 'SD'),
  ('city', '日照', '371100', 10, true, '{"en-US": "Rizhao", "zh-CN": "日照"}'::jsonb, 'SD'),
  ('city', '德州', '371400', 12, true, '{"en-US": "Dezhou", "zh-CN": "德州"}'::jsonb, 'SD'),
  ('city', '聊城', '371500', 13, true, '{"en-US": "Liaocheng", "zh-CN": "聊城"}'::jsonb, 'SD'),
  ('city', '滨州', '371600', 14, true, '{"en-US": "Binzhou", "zh-CN": "滨州"}'::jsonb, 'SD'),
  ('city', '菏泽', '371700', 15, true, '{"en-US": "Heze", "zh-CN": "菏泽"}'::jsonb, 'SD'),

  -- 河南省
  ('city', '开封', '410200', 1, true, '{"en-US": "Kaifeng", "zh-CN": "开封"}'::jsonb, 'HA'),
  ('city', '平顶山', '410400', 3, true, '{"en-US": "Pingdingshan", "zh-CN": "平顶山"}'::jsonb, 'HA'),
  ('city', '鹤壁', '410600', 5, true, '{"en-US": "Hebi", "zh-CN": "鹤壁"}'::jsonb, 'HA'),
  ('city', '新乡', '410700', 6, true, '{"en-US": "Xinxiang", "zh-CN": "新乡"}'::jsonb, 'HA'),
  ('city', '焦作', '410800', 7, true, '{"en-US": "Jiaozuo", "zh-CN": "焦作"}'::jsonb, 'HA'),
  ('city', '濮阳', '410900', 8, true, '{"en-US": "Puyang", "zh-CN": "濮阳"}'::jsonb, 'HA'),
  ('city', '许昌', '411000', 9, true, '{"en-US": "Xuchang", "zh-CN": "许昌"}'::jsonb, 'HA'),
  ('city', '漯河', '411100', 10, true, '{"en-US": "Luohe", "zh-CN": "漯河"}'::jsonb, 'HA'),
  ('city', '三门峡', '411200', 11, true, '{"en-US": "Sanmenxia", "zh-CN": "三门峡"}'::jsonb, 'HA'),
  ('city', '南阳', '411300', 12, true, '{"en-US": "Nanyang", "zh-CN": "南阳"}'::jsonb, 'HA'),
  ('city', '商丘', '411400', 13, true, '{"en-US": "Shangqiu", "zh-CN": "商丘"}'::jsonb, 'HA'),
  ('city', '信阳', '411500', 14, true, '{"en-US": "Xinyang", "zh-CN": "信阳"}'::jsonb, 'HA'),
  ('city', '周口', '411600', 15, true, '{"en-US": "Zhoukou", "zh-CN": "周口"}'::jsonb, 'HA'),
  ('city', '驻马店', '411700', 16, true, '{"en-US": "Zhumadian", "zh-CN": "驻马店"}'::jsonb, 'HA'),

  -- 湖北省
  ('city', '黄石', '420200', 1, true, '{"en-US": "Huangshi", "zh-CN": "黄石"}'::jsonb, 'HB'),
  ('city', '十堰', '420300', 2, true, '{"en-US": "Shiyan", "zh-CN": "十堰"}'::jsonb, 'HB'),
  ('city', '宜昌', '420500', 3, true, '{"en-US": "Yichang", "zh-CN": "宜昌"}'::jsonb, 'HB'),
  ('city', '襄阳', '420600', 4, true, '{"en-US": "Xiangyang", "zh-CN": "襄阳"}'::jsonb, 'HB'),
  ('city', '鄂州', '420700', 5, true, '{"en-US": "Ezhou", "zh-CN": "鄂州"}'::jsonb, 'HB'),
  ('city', '荆门', '420800', 6, true, '{"en-US": "Jingmen", "zh-CN": "荆门"}'::jsonb, 'HB'),
  ('city', '孝感', '420900', 7, true, '{"en-US": "Xiaogan", "zh-CN": "孝感"}'::jsonb, 'HB'),
  ('city', '荆州', '421000', 8, true, '{"en-US": "Jingzhou", "zh-CN": "荆州"}'::jsonb, 'HB'),
  ('city', '黄冈', '421100', 9, true, '{"en-US": "Huanggang", "zh-CN": "黄冈"}'::jsonb, 'HB'),
  ('city', '咸宁', '421200', 10, true, '{"en-US": "Xianning", "zh-CN": "咸宁"}'::jsonb, 'HB'),
  ('city', '随州', '421300', 11, true, '{"en-US": "Suizhou", "zh-CN": "随州"}'::jsonb, 'HB'),
  ('city', '恩施', '422800', 12, true, '{"en-US": "Enshi", "zh-CN": "恩施"}'::jsonb, 'HB'),

  -- 湖南省
  ('city', '长沙', '430100', 0, true, '{"en-US": "Changsha", "zh-CN": "长沙"}'::jsonb, 'HN'),
  ('city', '株洲', '430200', 1, true, '{"en-US": "Zhuzhou", "zh-CN": "株洲"}'::jsonb, 'HN'),
  ('city', '湘潭', '430300', 2, true, '{"en-US": "Xiangtan", "zh-CN": "湘潭"}'::jsonb, 'HN'),
  ('city', '衡阳', '430400', 3, true, '{"en-US": "Hengyang", "zh-CN": "衡阳"}'::jsonb, 'HN'),
  ('city', '邵阳', '430500', 4, true, '{"en-US": "Shaoyang", "zh-CN": "邵阳"}'::jsonb, 'HN'),
  ('city', '岳阳', '430600', 5, true, '{"en-US": "Yueyang", "zh-CN": "岳阳"}'::jsonb, 'HN'),
  ('city', '常德', '430700', 6, true, '{"en-US": "Changde", "zh-CN": "常德"}'::jsonb, 'HN'),
  ('city', '张家界', '430800', 7, true, '{"en-US": "Zhangjiajie", "zh-CN": "张家界"}'::jsonb, 'HN'),
  ('city', '益阳', '430900', 8, true, '{"en-US": "Yiyang", "zh-CN": "益阳"}'::jsonb, 'HN'),
  ('city', '郴州', '431000', 9, true, '{"en-US": "Chenzhou", "zh-CN": "郴州"}'::jsonb, 'HN'),
  ('city', '永州', '431100', 10, true, '{"en-US": "Yongzhou", "zh-CN": "永州"}'::jsonb, 'HN'),
  ('city', '怀化', '431200', 11, true, '{"en-US": "Huaihua", "zh-CN": "怀化"}'::jsonb, 'HN'),
  ('city', '娄底', '431300', 12, true, '{"en-US": "Loudi", "zh-CN": "娄底"}'::jsonb, 'HN'),
  ('city', '湘西', '433100', 13, true, '{"en-US": "Xiangxi", "zh-CN": "湘西"}'::jsonb, 'HN'),

  -- 广东省
  ('city', '韶关', '440200', 1, true, '{"en-US": "Shaoguan", "zh-CN": "韶关"}'::jsonb, 'GD'),
  ('city', '汕头', '440500', 4, true, '{"en-US": "Shantou", "zh-CN": "汕头"}'::jsonb, 'GD'),
  ('city', '湛江', '440800', 7, true, '{"en-US": "Zhanjiang", "zh-CN": "湛江"}'::jsonb, 'GD'),
  ('city', '茂名', '440900', 8, true, '{"en-US": "Maoming", "zh-CN": "茂名"}'::jsonb, 'GD'),
  ('city', '肇庆', '441200', 9, true, '{"en-US": "Zhaoqing", "zh-CN": "肇庆"}'::jsonb, 'GD'),
  ('city', '梅州', '441400', 11, true, '{"en-US": "Meizhou", "zh-CN": "梅州"}'::jsonb, 'GD'),
  ('city', '汕尾', '441500', 12, true, '{"en-US": "Shanwei", "zh-CN": "汕尾"}'::jsonb, 'GD'),
  ('city', '河源', '441600', 13, true, '{"en-US": "Heyuan", "zh-CN": "河源"}'::jsonb, 'GD'),
  ('city', '阳江', '441700', 14, true, '{"en-US": "Yangjiang", "zh-CN": "阳江"}'::jsonb, 'GD'),
  ('city', '潮州', '445100', 18, true, '{"en-US": "Chaozhou", "zh-CN": "潮州"}'::jsonb, 'GD'),
  ('city', '揭阳', '445200', 19, true, '{"en-US": "Jieyang", "zh-CN": "揭阳"}'::jsonb, 'GD'),
  ('city', '云浮', '445300', 20, true, '{"en-US": "Yunfu", "zh-CN": "云浮"}'::jsonb, 'GD'),

  -- 海南省
  ('city', '海口', '460100', 0, true, '{"en-US": "Haikou", "zh-CN": "海口"}'::jsonb, 'HI'),
  ('city', '三亚', '460200', 1, true, '{"en-US": "Sanya", "zh-CN": "三亚"}'::jsonb, 'HI'),
  ('city', '三沙', '460300', 2, true, '{"en-US": "Sansha", "zh-CN": "三沙"}'::jsonb, 'HI'),
  ('city', '儋州', '460400', 3, true, '{"en-US": "Danzhou", "zh-CN": "儋州"}'::jsonb, 'HI'),
  ('city', '五指山', '469001', 4, true, '{"en-US": "Wuzhishan", "zh-CN": "五指山"}'::jsonb, 'HI'),
  ('city', '琼海', '469002', 5, true, '{"en-US": "Qionghai", "zh-CN": "琼海"}'::jsonb, 'HI'),
  ('city', '文昌', '469005', 6, true, '{"en-US": "Wenchang", "zh-CN": "文昌"}'::jsonb, 'HI'),
  ('city', '万宁', '469006', 7, true, '{"en-US": "Wanning", "zh-CN": "万宁"}'::jsonb, 'HI'),
  ('city', '东方', '469007', 8, true, '{"en-US": "Dongfang", "zh-CN": "东方"}'::jsonb, 'HI'),
  ('city', '定安', '469021', 9, true, '{"en-US": "Ding''an", "zh-CN": "定安"}'::jsonb, 'HI'),
  ('city', '屯昌', '469022', 10, true, '{"en-US": "Tunchang", "zh-CN": "屯昌"}'::jsonb, 'HI'),
  ('city', '澄迈', '469023', 11, true, '{"en-US": "Chengmai", "zh-CN": "澄迈"}'::jsonb, 'HI'),
  ('city', '临高', '469024', 12, true, '{"en-US": "Lingao", "zh-CN": "临高"}'::jsonb, 'HI'),
  ('city', '白沙', '469025', 13, true, '{"en-US": "Baisha", "zh-CN": "白沙"}'::jsonb, 'HI'),
  ('city', '昌江', '469026', 14, true, '{"en-US": "Changjiang", "zh-CN": "昌江"}'::jsonb, 'HI'),
  ('city', '乐东', '469027', 15, true, '{"en-US": "Ledong", "zh-CN": "乐东"}'::jsonb, 'HI'),
  ('city', '陵水', '469028', 16, true, '{"en-US": "Lingshui", "zh-CN": "陵水"}'::jsonb, 'HI'),
  ('city', '保亭', '469029', 17, true, '{"en-US": "Baoting", "zh-CN": "保亭"}'::jsonb, 'HI'),
  ('city', '琼中', '469030', 18, true, '{"en-US": "Qiongzhong", "zh-CN": "琼中"}'::jsonb, 'HI'),

  -- 四川省
  ('city', '自贡', '510300', 1, true, '{"en-US": "Zigong", "zh-CN": "自贡"}'::jsonb, 'SC'),
  ('city', '攀枝花', '510400', 2, true, '{"en-US": "Panzhihua", "zh-CN": "攀枝花"}'::jsonb, 'SC'),
  ('city', '泸州', '510500', 3, true, '{"en-US": "Luzhou", "zh-CN": "泸州"}'::jsonb, 'SC'),
  ('city', '德阳', '510600', 4, true, '{"en-US": "Deyang", "zh-CN": "德阳"}'::jsonb, 'SC'),
  ('city', '绵阳', '510700', 5, true, '{"en-US": "Mianyang", "zh-CN": "绵阳"}'::jsonb, 'SC'),
  ('city', '广元', '510800', 6, true, '{"en-US": "Guangyuan", "zh-CN": "广元"}'::jsonb, 'SC'),
  ('city', '遂宁', '510900', 7, true, '{"en-US": "Suining", "zh-CN": "遂宁"}'::jsonb, 'SC'),
  ('city', '内江', '511000', 8, true, '{"en-US": "Neijiang", "zh-CN": "内江"}'::jsonb, 'SC'),
  ('city', '乐山', '511100', 9, true, '{"en-US": "Leshan", "zh-CN": "乐山"}'::jsonb, 'SC'),
  ('city', '南充', '511300', 10, true, '{"en-US": "Nanchong", "zh-CN": "南充"}'::jsonb, 'SC'),
  ('city', '眉山', '511400', 11, true, '{"en-US": "Meishan", "zh-CN": "眉山"}'::jsonb, 'SC'),
  ('city', '宜宾', '511500', 12, true, '{"en-US": "Yibin", "zh-CN": "宜宾"}'::jsonb, 'SC'),
  ('city', '广安', '511600', 13, true, '{"en-US": "Guang''an", "zh-CN": "广安"}'::jsonb, 'SC'),
  ('city', '达州', '511700', 14, true, '{"en-US": "Dazhou", "zh-CN": "达州"}'::jsonb, 'SC'),
  ('city', '雅安', '511800', 15, true, '{"en-US": "Ya''an", "zh-CN": "雅安"}'::jsonb, 'SC'),
  ('city', '巴中', '511900', 16, true, '{"en-US": "Bazhong", "zh-CN": "巴中"}'::jsonb, 'SC'),
  ('city', '资阳', '512000', 17, true, '{"en-US": "Ziyang", "zh-CN": "资阳"}'::jsonb, 'SC'),
  ('city', '阿坝', '513200', 18, true, '{"en-US": "Aba", "zh-CN": "阿坝"}'::jsonb, 'SC'),
  ('city', '甘孜', '513300', 19, true, '{"en-US": "Ganzi", "zh-CN": "甘孜"}'::jsonb, 'SC'),
  ('city', '凉山', '513400', 20, true, '{"en-US": "Liangshan", "zh-CN": "凉山"}'::jsonb, 'SC'),

  -- 贵州省
  ('city', '贵阳', '520100', 0, true, '{"en-US": "Guiyang", "zh-CN": "贵阳"}'::jsonb, 'GZ'),
  ('city', '六盘水', '520200', 1, true, '{"en-US": "Liupanshui", "zh-CN": "六盘水"}'::jsonb, 'GZ'),
  ('city', '安顺', '520400', 3, true, '{"en-US": "Anshun", "zh-CN": "安顺"}'::jsonb, 'GZ'),
  ('city', '毕节', '520500', 4, true, '{"en-US": "Bijie", "zh-CN": "毕节"}'::jsonb, 'GZ'),
  ('city', '铜仁', '520600', 5, true, '{"en-US": "Tongren", "zh-CN": "铜仁"}'::jsonb, 'GZ'),
  ('city', '黔西南', '522300', 6, true, '{"en-US": "Qianxinan", "zh-CN": "黔西南"}'::jsonb, 'GZ'),
  ('city', '黔东南', '522600', 7, true, '{"en-US": "Qiandongnan", "zh-CN": "黔东南"}'::jsonb, 'GZ'),
  ('city', '黔南', '522700', 8, true, '{"en-US": "Qiannan", "zh-CN": "黔南"}'::jsonb, 'GZ'),

  -- 云南省
  ('city', '曲靖', '530300', 1, true, '{"en-US": "Qujing", "zh-CN": "曲靖"}'::jsonb, 'YN'),
  ('city', '玉溪', '530400', 2, true, '{"en-US": "Yuxi", "zh-CN": "玉溪"}'::jsonb, 'YN'),
  ('city', '保山', '530500', 3, true, '{"en-US": "Baoshan", "zh-CN": "保山"}'::jsonb, 'YN'),
  ('city', '昭通', '530600', 4, true, '{"en-US": "Zhaotong", "zh-CN": "昭通"}'::jsonb, 'YN'),
  ('city', '丽江', '530700', 5, true, '{"en-US": "Lijiang", "zh-CN": "丽江"}'::jsonb, 'YN'),
  ('city', '普洱', '530800', 6, true, '{"en-US": "Pu''er", "zh-CN": "普洱"}'::jsonb, 'YN'),
  ('city', '临沧', '530900', 7, true, '{"en-US": "Lincang", "zh-CN": "临沧"}'::jsonb, 'YN'),
  ('city', '楚雄', '532300', 8, true, '{"en-US": "Chuxiong", "zh-CN": "楚雄"}'::jsonb, 'YN'),
  ('city', '红河', '532500', 9, true, '{"en-US": "Honghe", "zh-CN": "红河"}'::jsonb, 'YN'),
  ('city', '文山', '532600', 10, true, '{"en-US": "Wenshan", "zh-CN": "文山"}'::jsonb, 'YN'),
  ('city', '西双版纳', '532800', 11, true, '{"en-US": "Xishuangbanna", "zh-CN": "西双版纳"}'::jsonb, 'YN'),
  ('city', '大理', '532900', 12, true, '{"en-US": "Dali", "zh-CN": "大理"}'::jsonb, 'YN'),
  ('city', '德宏', '533100', 13, true, '{"en-US": "Dehong", "zh-CN": "德宏"}'::jsonb, 'YN'),
  ('city', '怒江', '533300', 14, true, '{"en-US": "Nujiang", "zh-CN": "怒江"}'::jsonb, 'YN'),
  ('city', '迪庆', '533400', 15, true, '{"en-US": "Diqing", "zh-CN": "迪庆"}'::jsonb, 'YN'),

  -- 陕西省
  ('city', '铜川', '610200', 1, true, '{"en-US": "Tongchuan", "zh-CN": "铜川"}'::jsonb, 'SN'),
  ('city', '宝鸡', '610300', 2, true, '{"en-US": "Baoji", "zh-CN": "宝鸡"}'::jsonb, 'SN'),
  ('city', '咸阳', '610400', 3, true, '{"en-US": "Xianyang", "zh-CN": "咸阳"}'::jsonb, 'SN'),
  ('city', '渭南', '610500', 4, true, '{"en-US": "Weinan", "zh-CN": "渭南"}'::jsonb, 'SN'),
  ('city', '延安', '610600', 5, true, '{"en-US": "Yan''an", "zh-CN": "延安"}'::jsonb, 'SN'),
  ('city', '汉中', '610700', 6, true, '{"en-US": "Hanzhong", "zh-CN": "汉中"}'::jsonb, 'SN'),
  ('city', '榆林', '610800', 7, true, '{"en-US": "Yulin", "zh-CN": "榆林"}'::jsonb, 'SN'),
  ('city', '安康', '610900', 8, true, '{"en-US": "Ankang", "zh-CN": "安康"}'::jsonb, 'SN'),
  ('city', '商洛', '611000', 9, true, '{"en-US": "Shangluo", "zh-CN": "商洛"}'::jsonb, 'SN'),

  -- 甘肃省
  ('city', '嘉峪关', '620200', 1, true, '{"en-US": "Jiayuguan", "zh-CN": "嘉峪关"}'::jsonb, 'GS'),
  ('city', '金昌', '620300', 2, true, '{"en-US": "Jinchang", "zh-CN": "金昌"}'::jsonb, 'GS'),
  ('city', '白银', '620400', 3, true, '{"en-US": "Baiyin", "zh-CN": "白银"}'::jsonb, 'GS'),
  ('city', '天水', '620500', 4, true, '{"en-US": "Tianshui", "zh-CN": "天水"}'::jsonb, 'GS'),
  ('city', '武威', '620600', 5, true, '{"en-US": "Wuwei", "zh-CN": "武威"}'::jsonb, 'GS'),
  ('city', '张掖', '620700', 6, true, '{"en-US": "Zhangye", "zh-CN": "张掖"}'::jsonb, 'GS'),
  ('city', '平凉', '620800', 7, true, '{"en-US": "Pingliang", "zh-CN": "平凉"}'::jsonb, 'GS'),
  ('city', '酒泉', '620900', 8, true, '{"en-US": "Jiuquan", "zh-CN": "酒泉"}'::jsonb, 'GS'),
  ('city', '庆阳', '621000', 9, true, '{"en-US": "Qingyang", "zh-CN": "庆阳"}'::jsonb, 'GS'),
  ('city', '定西', '621100', 10, true, '{"en-US": "Dingxi", "zh-CN": "定西"}'::jsonb, 'GS'),
  ('city', '陇南', '621200', 11, true, '{"en-US": "Longnan", "zh-CN": "陇南"}'::jsonb, 'GS'),
  ('city', '临夏', '622900', 12, true, '{"en-US": "Linxia", "zh-CN": "临夏"}'::jsonb, 'GS'),
  ('city', '甘南', '623000', 13, true, '{"en-US": "Gannan", "zh-CN": "甘南"}'::jsonb, 'GS'),

  -- 青海省
  ('city', '西宁', '630100', 0, true, '{"en-US": "Xining", "zh-CN": "西宁"}'::jsonb, 'QH'),
  ('city', '海东', '630200', 1, true, '{"en-US": "Haidong", "zh-CN": "海东"}'::jsonb, 'QH'),
  ('city', '海北', '632200', 2, true, '{"en-US": "Haibei", "zh-CN": "海北"}'::jsonb, 'QH'),
  ('city', '黄南', '632300', 3, true, '{"en-US": "Huangnan", "zh-CN": "黄南"}'::jsonb, 'QH'),
  ('city', '海南', '632500', 4, true, '{"en-US": "Hainan", "zh-CN": "海南"}'::jsonb, 'QH'),
  ('city', '果洛', '632600', 5, true, '{"en-US": "Golog", "zh-CN": "果洛"}'::jsonb, 'QH'),
  ('city', '玉树', '632700', 6, true, '{"en-US": "Yushu", "zh-CN": "玉树"}'::jsonb, 'QH'),
  ('city', '海西', '632800', 7, true, '{"en-US": "Haixi", "zh-CN": "海西"}'::jsonb, 'QH'),

  -- 台湾省
  ('city', '台北', '710100', 0, true, '{"en-US": "Taipei", "zh-CN": "台北"}'::jsonb, 'TW'),
  ('city', '新北', '710200', 1, true, '{"en-US": "New Taipei", "zh-CN": "新北"}'::jsonb, 'TW'),
  ('city', '桃园', '710300', 2, true, '{"en-US": "Taoyuan", "zh-CN": "桃园"}'::jsonb, 'TW'),
  ('city', '台中', '710400', 3, true, '{"en-US": "Taichung", "zh-CN": "台中"}'::jsonb, 'TW'),
  ('city', '台南', '710500', 4, true, '{"en-US": "Tainan", "zh-CN": "台南"}'::jsonb, 'TW'),
  ('city', '高雄', '710600', 5, true, '{"en-US": "Kaohsiung", "zh-CN": "高雄"}'::jsonb, 'TW'),
  ('city', '基隆', '710700', 6, true, '{"en-US": "Keelung", "zh-CN": "基隆"}'::jsonb, 'TW'),
  ('city', '新竹', '710800', 7, true, '{"en-US": "Hsinchu", "zh-CN": "新竹"}'::jsonb, 'TW'),
  ('city', '嘉义', '710900', 8, true, '{"en-US": "Chiayi", "zh-CN": "嘉义"}'::jsonb, 'TW'),
  ('city', '苗栗', '711000', 9, true, '{"en-US": "Miaoli", "zh-CN": "苗栗"}'::jsonb, 'TW'),
  ('city', '彰化', '711100', 10, true, '{"en-US": "Changhua", "zh-CN": "彰化"}'::jsonb, 'TW'),
  ('city', '南投', '711200', 11, true, '{"en-US": "Nantou", "zh-CN": "南投"}'::jsonb, 'TW'),
  ('city', '云林', '711300', 12, true, '{"en-US": "Yunlin", "zh-CN": "云林"}'::jsonb, 'TW'),
  ('city', '嘉义县', '711400', 13, true, '{"en-US": "Chiayi County", "zh-CN": "嘉义县"}'::jsonb, 'TW'),
  ('city', '屏东', '711500', 14, true, '{"en-US": "Pingtung", "zh-CN": "屏东"}'::jsonb, 'TW'),
  ('city', '宜兰', '711600', 15, true, '{"en-US": "Yilan", "zh-CN": "宜兰"}'::jsonb, 'TW'),
  ('city', '花莲', '711700', 16, true, '{"en-US": "Hualien", "zh-CN": "花莲"}'::jsonb, 'TW'),
  ('city', '台东', '711800', 17, true, '{"en-US": "Taitung", "zh-CN": "台东"}'::jsonb, 'TW'),
  ('city', '澎湖', '711900', 18, true, '{"en-US": "Penghu", "zh-CN": "澎湖"}'::jsonb, 'TW'),

  -- 内蒙古自治区
  ('city', '呼和浩特', '150100', 0, true, '{"en-US": "Hohhot", "zh-CN": "呼和浩特"}'::jsonb, 'NM'),
  ('city', '包头', '150200', 1, true, '{"en-US": "Baotou", "zh-CN": "包头"}'::jsonb, 'NM'),
  ('city', '乌海', '150300', 2, true, '{"en-US": "Wuhai", "zh-CN": "乌海"}'::jsonb, 'NM'),
  ('city', '赤峰', '150400', 3, true, '{"en-US": "Chifeng", "zh-CN": "赤峰"}'::jsonb, 'NM'),
  ('city', '通辽', '150500', 4, true, '{"en-US": "Tongliao", "zh-CN": "通辽"}'::jsonb, 'NM'),
  ('city', '鄂尔多斯', '150600', 5, true, '{"en-US": "Ordos", "zh-CN": "鄂尔多斯"}'::jsonb, 'NM'),
  ('city', '呼伦贝尔', '150700', 6, true, '{"en-US": "Hulunbuir", "zh-CN": "呼伦贝尔"}'::jsonb, 'NM'),
  ('city', '巴彦淖尔', '150800', 7, true, '{"en-US": "Bayannur", "zh-CN": "巴彦淖尔"}'::jsonb, 'NM'),
  ('city', '乌兰察布', '150900', 8, true, '{"en-US": "Ulanqab", "zh-CN": "乌兰察布"}'::jsonb, 'NM'),
  ('city', '兴安', '152200', 9, true, '{"en-US": "Hinggan", "zh-CN": "兴安"}'::jsonb, 'NM'),
  ('city', '锡林郭勒', '152500', 10, true, '{"en-US": "Xilingol", "zh-CN": "锡林郭勒"}'::jsonb, 'NM'),
  ('city', '阿拉善', '152900', 11, true, '{"en-US": "Alxa", "zh-CN": "阿拉善"}'::jsonb, 'NM'),

  -- 广西壮族自治区
  ('city', '柳州', '450200', 1, true, '{"en-US": "Liuzhou", "zh-CN": "柳州"}'::jsonb, 'GX'),
  ('city', '梧州', '450400', 3, true, '{"en-US": "Wuzhou", "zh-CN": "梧州"}'::jsonb, 'GX'),
  ('city', '北海', '450500', 4, true, '{"en-US": "Beihai", "zh-CN": "北海"}'::jsonb, 'GX'),
  ('city', '防城港', '450600', 5, true, '{"en-US": "Fangchenggang", "zh-CN": "防城港"}'::jsonb, 'GX'),
  ('city', '钦州', '450700', 6, true, '{"en-US": "Qinzhou", "zh-CN": "钦州"}'::jsonb, 'GX'),
  ('city', '贵港', '450800', 7, true, '{"en-US": "Guigang", "zh-CN": "贵港"}'::jsonb, 'GX'),
  ('city', '玉林', '450900', 8, true, '{"en-US": "Yulin", "zh-CN": "玉林"}'::jsonb, 'GX'),
  ('city', '贺州', '451100', 10, true, '{"en-US": "Hezhou", "zh-CN": "贺州"}'::jsonb, 'GX'),
  ('city', '河池', '451200', 11, true, '{"en-US": "Hechi", "zh-CN": "河池"}'::jsonb, 'GX'),
  ('city', '来宾', '451300', 12, true, '{"en-US": "Laibin", "zh-CN": "来宾"}'::jsonb, 'GX'),
  ('city', '崇左', '451400', 13, true, '{"en-US": "Chongzuo", "zh-CN": "崇左"}'::jsonb, 'GX'),

  -- 西藏自治区
  ('city', '拉萨', '540100', 0, true, '{"en-US": "Lhasa", "zh-CN": "拉萨"}'::jsonb, 'XZ'),
  ('city', '日喀则', '540200', 1, true, '{"en-US": "Shigatse", "zh-CN": "日喀则"}'::jsonb, 'XZ'),
  ('city', '昌都', '540300', 2, true, '{"en-US": "Qamdo", "zh-CN": "昌都"}'::jsonb, 'XZ'),
  ('city', '林芝', '540400', 3, true, '{"en-US": "Nyingchi", "zh-CN": "林芝"}'::jsonb, 'XZ'),
  ('city', '山南', '540500', 4, true, '{"en-US": "Shannan", "zh-CN": "山南"}'::jsonb, 'XZ'),
  ('city', '那曲', '540600', 5, true, '{"en-US": "Nagqu", "zh-CN": "那曲"}'::jsonb, 'XZ'),
  ('city', '阿里', '542500', 6, true, '{"en-US": "Ngari", "zh-CN": "阿里"}'::jsonb, 'XZ'),

  -- 宁夏回族自治区
  ('city', '银川', '640100', 0, true, '{"en-US": "Yinchuan", "zh-CN": "银川"}'::jsonb, 'NX'),
  ('city', '石嘴山', '640200', 1, true, '{"en-US": "Shizuishan", "zh-CN": "石嘴山"}'::jsonb, 'NX'),
  ('city', '吴忠', '640300', 2, true, '{"en-US": "Wuzhong", "zh-CN": "吴忠"}'::jsonb, 'NX'),
  ('city', '固原', '640400', 3, true, '{"en-US": "Guyuan", "zh-CN": "固原"}'::jsonb, 'NX'),
  ('city', '中卫', '640500', 4, true, '{"en-US": "Zhongwei", "zh-CN": "中卫"}'::jsonb, 'NX'),

  -- 新疆维吾尔自治区
  ('city', '克拉玛依', '650200', 1, true, '{"en-US": "Karamay", "zh-CN": "克拉玛依"}'::jsonb, 'XJ'),
  ('city', '吐鲁番', '650400', 2, true, '{"en-US": "Turpan", "zh-CN": "吐鲁番"}'::jsonb, 'XJ'),
  ('city', '哈密', '650500', 3, true, '{"en-US": "Hami", "zh-CN": "哈密"}'::jsonb, 'XJ'),
  ('city', '昌吉', '652300', 4, true, '{"en-US": "Changji", "zh-CN": "昌吉"}'::jsonb, 'XJ'),
  ('city', '博尔塔拉', '652700', 5, true, '{"en-US": "Bortala", "zh-CN": "博尔塔拉"}'::jsonb, 'XJ'),
  ('city', '巴音郭楞', '652800', 6, true, '{"en-US": "Bayingol", "zh-CN": "巴音郭楞"}'::jsonb, 'XJ'),
  ('city', '阿克苏', '652900', 7, true, '{"en-US": "Aksu", "zh-CN": "阿克苏"}'::jsonb, 'XJ'),
  ('city', '克孜勒苏', '653000', 8, true, '{"en-US": "Kizilsu", "zh-CN": "克孜勒苏"}'::jsonb, 'XJ'),
  ('city', '喀什', '653100', 9, true, '{"en-US": "Kashgar", "zh-CN": "喀什"}'::jsonb, 'XJ'),
  ('city', '和田', '653200', 10, true, '{"en-US": "Hotan", "zh-CN": "和田"}'::jsonb, 'XJ'),
  ('city', '伊犁', '654000', 11, true, '{"en-US": "Ili", "zh-CN": "伊犁"}'::jsonb, 'XJ'),
  ('city', '塔城', '654200', 12, true, '{"en-US": "Tacheng", "zh-CN": "塔城"}'::jsonb, 'XJ'),
  ('city', '阿勒泰', '654300', 13, true, '{"en-US": "Altay", "zh-CN": "阿勒泰"}'::jsonb, 'XJ'),

  -- 香港特别行政区
  ('city', '香港', '810100', 0, true, '{"en-US": "Hong Kong", "zh-CN": "香港"}'::jsonb, 'HK'),

  -- 澳门特别行政区
  ('city', '澳门', '820100', 0, true, '{"en-US": "Macau", "zh-CN": "澳门"}'::jsonb, 'MO')
) AS v(dict_code, item_label, item_value, sort_order, status, label_i18n, parent_value)
WHERE NOT EXISTS (
  SELECT 1 FROM sys_dict_item WHERE dict_code = v.dict_code AND item_value = v.item_value
);

-- 统计结果
SELECT '数据导入完成' AS result;
SELECT 
  (SELECT COUNT(*) FROM sys_dict_item WHERE dict_code = 'country') AS province_count,
  (SELECT COUNT(*) FROM sys_dict_item WHERE dict_code = 'city') AS city_count;