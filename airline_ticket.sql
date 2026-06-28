/*
 Navicat Premium Dump SQL

 Source Server         : Flight-project
 Source Server Type    : MySQL
 Source Server Version : 90600 (9.6.0)
 Source Host           : localhost:3306
 Source Schema         : airline_ticket

 Target Server Type    : MySQL
 Target Server Version : 90600 (9.6.0)
 File Encoding         : 65001

 Date: 28/06/2026 22:28:25
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for airport
-- ----------------------------
DROP TABLE IF EXISTS `airport`;
CREATE TABLE `airport`  (
  `airport_code` char(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '机场三字/四字代码 主键',
  `airport_name` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '机场名称',
  `area_code` char(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '所属城市行政区划代码 外键',
  PRIMARY KEY (`airport_code`) USING BTREE,
  INDEX `area_code`(`area_code` ASC) USING BTREE,
  CONSTRAINT `airport_ibfk_1` FOREIGN KEY (`area_code`) REFERENCES `city` (`area_code`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '机场表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of airport
-- ----------------------------
INSERT INTO `airport` VALUES ('CAN', '广州白云国际机场', '440100');
INSERT INTO `airport` VALUES ('CGO', '郑州新郑国际机场', '410100');
INSERT INTO `airport` VALUES ('CGQ', '长春龙嘉国际机场', '220100');
INSERT INTO `airport` VALUES ('CKG', '重庆江北国际机场', '500000');
INSERT INTO `airport` VALUES ('CSX', '长沙黄花国际机场', '430100');
INSERT INTO `airport` VALUES ('CTU', '成都双流国际机场', '510100');
INSERT INTO `airport` VALUES ('CZX', '常州奔牛国际机场', '320400');
INSERT INTO `airport` VALUES ('DLC', '大连周水子国际机场', '210200');
INSERT INTO `airport` VALUES ('FOC', '福州长乐国际机场', '350100');
INSERT INTO `airport` VALUES ('FUO', '佛山沙堤机场', '440600');
INSERT INTO `airport` VALUES ('HAK', '海口美兰国际机场', '460100');
INSERT INTO `airport` VALUES ('HET', '呼和浩特白塔国际机场', '150100');
INSERT INTO `airport` VALUES ('HFE', '合肥新桥国际机场', '340100');
INSERT INTO `airport` VALUES ('HGH', '杭州萧山国际机场', '330100');
INSERT INTO `airport` VALUES ('HRB', '哈尔滨太平国际机场', '230100');
INSERT INTO `airport` VALUES ('JJN', '泉州晋江国际机场', '350500');
INSERT INTO `airport` VALUES ('KHN', '南昌昌北国际机场', '360100');
INSERT INTO `airport` VALUES ('KMG', '昆明长水国际机场', '530100');
INSERT INTO `airport` VALUES ('KWE', '贵阳龙洞堡国际机场', '520100');
INSERT INTO `airport` VALUES ('KWL', '桂林两江国际机场', '450300');
INSERT INTO `airport` VALUES ('LHW', '兰州中川国际机场', '620100');
INSERT INTO `airport` VALUES ('LXA', '拉萨贡嘎国际机场', '540100');
INSERT INTO `airport` VALUES ('LYA', '洛阳北郊机场', '410300');
INSERT INTO `airport` VALUES ('NGB', '宁波栎社国际机场', '330200');
INSERT INTO `airport` VALUES ('NKG', '南京禄口国际机场', '320100');
INSERT INTO `airport` VALUES ('NNG', '南宁吴圩国际机场', '450100');
INSERT INTO `airport` VALUES ('PEK', '北京首都国际机场', '110000');
INSERT INTO `airport` VALUES ('PKX', '北京大兴国际机场', '110000');
INSERT INTO `airport` VALUES ('PVG', '上海浦东国际机场', '310000');
INSERT INTO `airport` VALUES ('SHA', '上海虹桥国际机场', '310000');
INSERT INTO `airport` VALUES ('SHE', '沈阳桃仙国际机场', '210100');
INSERT INTO `airport` VALUES ('SJW', '石家庄正定国际机场', '130100');
INSERT INTO `airport` VALUES ('SYX', '三亚凤凰国际机场', '460200');
INSERT INTO `airport` VALUES ('SZX', '深圳宝安国际机场', '440300');
INSERT INTO `airport` VALUES ('TAO', '青岛胶东国际机场', '370200');
INSERT INTO `airport` VALUES ('TFU', '成都天府国际机场', '510100');
INSERT INTO `airport` VALUES ('TNA', '济南遥墙国际机场', '370100');
INSERT INTO `airport` VALUES ('TSN', '天津滨海国际机场', '120000');
INSERT INTO `airport` VALUES ('TYN', '太原武宿国际机场', '140100');
INSERT INTO `airport` VALUES ('URC', '乌鲁木齐地窝堡国际机场', '650100');
INSERT INTO `airport` VALUES ('WNZ', '温州龙湾国际机场', '330300');
INSERT INTO `airport` VALUES ('WUH', '武汉天河国际机场', '420100');
INSERT INTO `airport` VALUES ('WUX', '苏南硕放国际机场', '320200');
INSERT INTO `airport` VALUES ('XIY', '西安咸阳国际机场', '610100');
INSERT INTO `airport` VALUES ('XMN', '厦门高崎国际机场', '350200');
INSERT INTO `airport` VALUES ('XNN', '西宁曹家堡国际机场', '630100');
INSERT INTO `airport` VALUES ('XUZ', '徐州观音国际机场', '320300');
INSERT INTO `airport` VALUES ('YIH', '宜昌三峡机场', '420500');
INSERT INTO `airport` VALUES ('YNT', '烟台蓬莱国际机场', '370600');
INSERT INTO `airport` VALUES ('ZUH', '珠海金湾机场', '440400');

-- ----------------------------
-- Table structure for cabin_price
-- ----------------------------
DROP TABLE IF EXISTS `cabin_price`;
CREATE TABLE `cabin_price`  (
  `flight_no` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '航班号',
  `cabin_level` enum('头等舱','经济舱') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '舱位等级',
  `standard_price` decimal(10, 2) NOT NULL COMMENT '标准票价',
  PRIMARY KEY (`flight_no`, `cabin_level`) USING BTREE,
  CONSTRAINT `cabin_price_ibfk_1` FOREIGN KEY (`flight_no`) REFERENCES `flight` (`flight_no`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '航班舱位淡旺季定价表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of cabin_price
-- ----------------------------
INSERT INTO `cabin_price` VALUES ('MU151', '头等舱', 2880.00);
INSERT INTO `cabin_price` VALUES ('MU151', '经济舱', 1200.00);
INSERT INTO `cabin_price` VALUES ('MU152', '头等舱', 1400.00);
INSERT INTO `cabin_price` VALUES ('MU152', '经济舱', 800.00);
INSERT INTO `cabin_price` VALUES ('MU153', '头等舱', 1800.00);
INSERT INTO `cabin_price` VALUES ('MU153', '经济舱', 1200.00);

-- ----------------------------
-- Table structure for city
-- ----------------------------
DROP TABLE IF EXISTS `city`;
CREATE TABLE `city`  (
  `area_code` char(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '行政区划代码 主键',
  `city_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '城市名称',
  `province` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '省份',
  PRIMARY KEY (`area_code`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '城市表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of city
-- ----------------------------
INSERT INTO `city` VALUES ('110000', '北京市', '北京市');
INSERT INTO `city` VALUES ('120000', '天津市', '天津市');
INSERT INTO `city` VALUES ('130100', '石家庄市', '河北省');
INSERT INTO `city` VALUES ('140100', '太原市', '山西省');
INSERT INTO `city` VALUES ('150100', '呼和浩特市', '内蒙古自治区');
INSERT INTO `city` VALUES ('210100', '沈阳市', '辽宁省');
INSERT INTO `city` VALUES ('210200', '大连市', '辽宁省');
INSERT INTO `city` VALUES ('220100', '长春市', '吉林省');
INSERT INTO `city` VALUES ('230100', '哈尔滨市', '黑龙江省');
INSERT INTO `city` VALUES ('310000', '上海市', '上海市');
INSERT INTO `city` VALUES ('320100', '南京市', '江苏省');
INSERT INTO `city` VALUES ('320200', '无锡市', '江苏省');
INSERT INTO `city` VALUES ('320300', '徐州市', '江苏省');
INSERT INTO `city` VALUES ('320400', '常州市', '江苏省');
INSERT INTO `city` VALUES ('320500', '苏州市', '江苏省');
INSERT INTO `city` VALUES ('330100', '杭州市', '浙江省');
INSERT INTO `city` VALUES ('330200', '宁波市', '浙江省');
INSERT INTO `city` VALUES ('330300', '温州市', '浙江省');
INSERT INTO `city` VALUES ('340100', '合肥市', '安徽省');
INSERT INTO `city` VALUES ('350100', '福州市', '福建省');
INSERT INTO `city` VALUES ('350200', '厦门市', '福建省');
INSERT INTO `city` VALUES ('350500', '泉州市', '福建省');
INSERT INTO `city` VALUES ('360100', '南昌市', '江西省');
INSERT INTO `city` VALUES ('370100', '济南市', '山东省');
INSERT INTO `city` VALUES ('370200', '青岛市', '山东省');
INSERT INTO `city` VALUES ('370600', '烟台市', '山东省');
INSERT INTO `city` VALUES ('410100', '郑州市', '河南省');
INSERT INTO `city` VALUES ('410300', '洛阳市', '河南省');
INSERT INTO `city` VALUES ('420100', '武汉市', '湖北省');
INSERT INTO `city` VALUES ('420500', '宜昌市', '湖北省');
INSERT INTO `city` VALUES ('430100', '长沙市', '湖南省');
INSERT INTO `city` VALUES ('440100', '广州市', '广东省');
INSERT INTO `city` VALUES ('440300', '深圳市', '广东省');
INSERT INTO `city` VALUES ('440400', '珠海市', '广东省');
INSERT INTO `city` VALUES ('440600', '佛山市', '广东省');
INSERT INTO `city` VALUES ('441900', '东莞市', '广东省');
INSERT INTO `city` VALUES ('450100', '南宁市', '广西壮族自治区');
INSERT INTO `city` VALUES ('450300', '桂林市', '广西壮族自治区');
INSERT INTO `city` VALUES ('460100', '海口市', '海南省');
INSERT INTO `city` VALUES ('460200', '三亚市', '海南省');
INSERT INTO `city` VALUES ('500000', '重庆市', '重庆市');
INSERT INTO `city` VALUES ('510100', '成都市', '四川省');
INSERT INTO `city` VALUES ('520100', '贵阳市', '贵州省');
INSERT INTO `city` VALUES ('530100', '昆明市', '云南省');
INSERT INTO `city` VALUES ('540100', '拉萨市', '西藏自治区');
INSERT INTO `city` VALUES ('610100', '西安市', '陕西省');
INSERT INTO `city` VALUES ('620100', '兰州市', '甘肃省');
INSERT INTO `city` VALUES ('630100', '西宁市', '青海省');
INSERT INTO `city` VALUES ('650100', '乌鲁木齐市', '新疆维吾尔自治区');

-- ----------------------------
-- Table structure for flight
-- ----------------------------
DROP TABLE IF EXISTS `flight`;
CREATE TABLE `flight`  (
  `flight_no` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '航班号 主键',
  `plane_model` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '飞机机型',
  `first_class_num` int NOT NULL DEFAULT 0 COMMENT '头等舱座位总数',
  `economy_num` int NOT NULL DEFAULT 0 COMMENT '经济舱座位总数',
  `fly_week_day` set('1','2','3','4','5','6','7') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '每周飞行日 如1,3,5,7',
  `depart_time` time NOT NULL COMMENT '每日固定出发时间 HH:mm:ss',
  `arrive_time` time NOT NULL COMMENT '每日固定到达时间 HH:mm:ss',
  PRIMARY KEY (`flight_no`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '基础航班表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of flight
-- ----------------------------
INSERT INTO `flight` VALUES ('MU151', 'Boeing737', 20, 100, '1,2,4,5', '14:10:00', '18:07:00');
INSERT INTO `flight` VALUES ('MU152', 'Airbus1301', 10, 80, '1,3,4,7', '21:12:00', '23:41:00');
INSERT INTO `flight` VALUES ('MU153', 'Boeing 737', 20, 100, '2,3,6,7', '14:19:00', '17:14:00');

-- ----------------------------
-- Table structure for flight_instance
-- ----------------------------
DROP TABLE IF EXISTS `flight_instance`;
CREATE TABLE `flight_instance`  (
  `flight_no` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '航班号',
  `fly_date` date NOT NULL COMMENT '飞行日期',
  `flight_status` enum('计划','延误','取消','完成') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '航班状态',
  `first_remain` int NOT NULL DEFAULT 0 COMMENT '头等舱剩余座位',
  `economy_remain` int NOT NULL DEFAULT 0 COMMENT '经济舱剩余座位',
  `depart_time_actual` time NOT NULL COMMENT '实际起飞时间',
  `arrive_time_actual` time NOT NULL COMMENT '实际降落时间',
  PRIMARY KEY (`flight_no`, `fly_date`) USING BTREE,
  CONSTRAINT `flight_instance_ibfk_1` FOREIGN KEY (`flight_no`) REFERENCES `flight` (`flight_no`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '每日航班实例' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of flight_instance
-- ----------------------------
INSERT INTO `flight_instance` VALUES ('MU151', '2026-07-02', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-07-03', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-07-06', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-07-07', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-07-09', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-07-10', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-07-13', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-07-14', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-07-16', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-07-17', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-07-20', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-07-21', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-07-23', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-07-24', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-07-27', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-07-28', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-07-30', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-07-31', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-08-03', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-08-04', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-08-06', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-08-07', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-08-10', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-08-11', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-08-13', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-08-14', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-08-17', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-08-18', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-08-20', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-08-21', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-08-24', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-08-25', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-08-27', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-08-28', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU151', '2026-08-31', '计划', 20, 100, '14:10:00', '18:07:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-07-01', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-07-02', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-07-05', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-07-06', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-07-08', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-07-09', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-07-12', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-07-13', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-07-15', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-07-16', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-07-19', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-07-20', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-07-22', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-07-23', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-07-26', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-07-27', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-07-29', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-07-30', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-08-02', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-08-03', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-08-05', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-08-06', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-08-09', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-08-10', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-08-12', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-08-13', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-08-16', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-08-17', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-08-19', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-08-20', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-08-23', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-08-24', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-08-26', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-08-27', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-08-30', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU152', '2026-08-31', '计划', 10, 80, '21:12:00', '23:41:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-07-01', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-07-04', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-07-05', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-07-07', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-07-08', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-07-11', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-07-12', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-07-14', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-07-15', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-07-18', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-07-19', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-07-21', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-07-22', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-07-25', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-07-26', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-07-28', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-07-29', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-08-01', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-08-02', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-08-04', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-08-05', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-08-08', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-08-09', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-08-11', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-08-12', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-08-15', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-08-16', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-08-18', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-08-19', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-08-22', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-08-23', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-08-25', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-08-26', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-08-29', '计划', 20, 100, '14:19:00', '17:14:00');
INSERT INTO `flight_instance` VALUES ('MU153', '2026-08-30', '计划', 20, 100, '14:19:00', '17:14:00');

-- ----------------------------
-- Table structure for flight_stop
-- ----------------------------
DROP TABLE IF EXISTS `flight_stop`;
CREATE TABLE `flight_stop`  (
  `flight_no` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '航班号',
  `airport_code` char(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '机场代码',
  `stop_sort` enum('起飞','降落','经停1','经停2','经停3') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '停靠类型',
  PRIMARY KEY (`flight_no`, `airport_code`) USING BTREE,
  INDEX `airport_code`(`airport_code` ASC) USING BTREE,
  CONSTRAINT `flight_stop_ibfk_1` FOREIGN KEY (`flight_no`) REFERENCES `flight` (`flight_no`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `flight_stop_ibfk_2` FOREIGN KEY (`airport_code`) REFERENCES `airport` (`airport_code`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '航班经停中间表(航班与机场多对多)' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of flight_stop
-- ----------------------------
INSERT INTO `flight_stop` VALUES ('MU151', 'CAN', '起飞');
INSERT INTO `flight_stop` VALUES ('MU151', 'CTU', '经停1');
INSERT INTO `flight_stop` VALUES ('MU151', 'XNN', '降落');
INSERT INTO `flight_stop` VALUES ('MU152', 'PEK', '降落');
INSERT INTO `flight_stop` VALUES ('MU152', 'SHA', '起飞');
INSERT INTO `flight_stop` VALUES ('MU153', 'FOC', '起飞');
INSERT INTO `flight_stop` VALUES ('MU153', 'KWL', '降落');

-- ----------------------------
-- Table structure for passenger
-- ----------------------------
DROP TABLE IF EXISTS `passenger`;
CREATE TABLE `passenger`  (
  `id_card` char(18) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '身份证号 主键',
  `name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '姓名',
  `vip_level` enum('普通','银卡','金卡') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '会员等级',
  `phone` char(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '联系电话',
  `password` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '登录密码(加密存储)',
  PRIMARY KEY (`id_card`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '乘客表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of passenger
-- ----------------------------
INSERT INTO `passenger` VALUES ('112233445566778899', '洪雯琪', '银卡', '13380022765', '2d0f2f906f619be0c7ef2f8951ea27fc');
INSERT INTO `passenger` VALUES ('123456789123456789', '许露丹', '金卡', '13905213311', 'c7245e378dabe8a4cd2d981bfcdced85');
INSERT INTO `passenger` VALUES ('123456789987654321', '张芷萱', '普通', '18065517677', '85f6d21c9d288144c25dca88e0e2d5a2');

-- ----------------------------
-- Table structure for ticket_record
-- ----------------------------
DROP TABLE IF EXISTS `ticket_record`;
CREATE TABLE `ticket_record`  (
  `ticket_id` bigint NOT NULL AUTO_INCREMENT COMMENT '售票编号 主键自增',
  `id_card` char(18) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '乘客身份证号',
  `flight_no` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '航班号',
  `fly_date` date NOT NULL COMMENT '飞行日期',
  `cabin_level` enum('头等舱','经济舱') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '舱位等级',
  `real_price` decimal(10, 2) NOT NULL COMMENT '实际售价',
  `ticket_status` enum('已支付','已完成','已改签','已退票') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '售票状态',
  PRIMARY KEY (`ticket_id`) USING BTREE,
  INDEX `id_card`(`id_card` ASC) USING BTREE,
  INDEX `flight_no`(`flight_no` ASC, `fly_date` ASC) USING BTREE,
  CONSTRAINT `ticket_record_ibfk_1` FOREIGN KEY (`id_card`) REFERENCES `passenger` (`id_card`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ticket_record_ibfk_2` FOREIGN KEY (`flight_no`, `fly_date`) REFERENCES `flight_instance` (`flight_no`, `fly_date`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 20 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '售票订单记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of ticket_record
-- ----------------------------

-- ----------------------------
-- Table structure for vip_discount
-- ----------------------------
DROP TABLE IF EXISTS `vip_discount`;
CREATE TABLE `vip_discount`  (
  `discount_id` int NOT NULL AUTO_INCREMENT COMMENT '会员折扣档 主键自增',
  `vip_level` enum('普通','银卡','金卡') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '会员等级',
  `min_advance_day` int NOT NULL COMMENT '最小提前购票天数',
  `max_advance_day` int NOT NULL COMMENT '最大提前购票天数',
  `discount_rate` decimal(4, 2) NOT NULL COMMENT '购票折扣率 0.8代表8折',
  PRIMARY KEY (`discount_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '会员分时段折扣表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of vip_discount
-- ----------------------------
INSERT INTO `vip_discount` VALUES (1, '普通', 0, 3, 0.95);
INSERT INTO `vip_discount` VALUES (2, '银卡', 0, 3, 0.90);
INSERT INTO `vip_discount` VALUES (3, '金卡', 0, 3, 0.85);
INSERT INTO `vip_discount` VALUES (4, '普通', 4, 14, 1.00);
INSERT INTO `vip_discount` VALUES (5, '银卡', 4, 14, 0.96);
INSERT INTO `vip_discount` VALUES (6, '金卡', 4, 14, 0.92);
INSERT INTO `vip_discount` VALUES (7, '普通', 15, 30, 0.90);
INSERT INTO `vip_discount` VALUES (8, '银卡', 15, 30, 0.85);
INSERT INTO `vip_discount` VALUES (9, '金卡', 15, 30, 0.80);
INSERT INTO `vip_discount` VALUES (10, '普通', 31, 999, 0.85);
INSERT INTO `vip_discount` VALUES (11, '银卡', 31, 999, 0.80);
INSERT INTO `vip_discount` VALUES (12, '金卡', 31, 999, 0.75);

SET FOREIGN_KEY_CHECKS = 1;
