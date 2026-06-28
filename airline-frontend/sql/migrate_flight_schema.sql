-- ============================================
-- 航班表结构迁移脚本
-- 将 flight 表从旧结构迁移到新结构
-- 运行方式: mysql -u root -p airline_ticket < migrate_flight_schema.sql
-- ============================================

-- 1. 诊断：查看当前 flight 表结构
-- SHOW COLUMNS FROM flight;

-- 2. 添加 depart_time / arrive_time 列（如果缺失）
ALTER TABLE `flight`
  ADD COLUMN IF NOT EXISTS `depart_time` time NOT NULL DEFAULT '00:00:00' COMMENT '每日固定出发时间' AFTER `fly_week_day`;

ALTER TABLE `flight`
  ADD COLUMN IF NOT EXISTS `arrive_time` time NOT NULL DEFAULT '00:00:00' COMMENT '每日固定到达时间' AFTER `depart_time`;

-- 3. 创建 flight_stop 经停表（如果不存在）
CREATE TABLE IF NOT EXISTS `flight_stop` (
  `flight_no` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '航班号',
  `airport_code` char(4) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '机场代码',
  `stop_sort` enum('起飞','降落','经停1','经停2','经停3') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '停靠类型',
  PRIMARY KEY (`flight_no`,`airport_code`),
  KEY `airport_code` (`airport_code`),
  CONSTRAINT `flight_stop_ibfk_1` FOREIGN KEY (`flight_no`) REFERENCES `flight` (`flight_no`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `flight_stop_ibfk_2` FOREIGN KEY (`airport_code`) REFERENCES `airport` (`airport_code`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='航班经停中间表(航班与机场多对多)';

-- 4. 可选：删除废弃列（确认数据已迁移后执行）
-- ALTER TABLE `flight` DROP COLUMN IF EXISTS `departure_city`;
-- ALTER TABLE `flight` DROP COLUMN IF EXISTS `arrival_city`;
-- ALTER TABLE `flight` DROP COLUMN IF EXISTS `fly_duration`;
