import prisma from '../config/database.js';
import supabase from '../config/supabase.js';

export const getDailyStats = async (req, res) => {
  try {
    const { date, babyId } = req.query;

    if (!date) {
      return res.status(400).json({ error: '缺少日期参数' });
    }

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // 使用 Supabase
    if (supabase) {
      // 获取用户的家庭
      const { data: familyMembers } = await supabase
        .from('FamilyMember')
        .select('familyId')
        .eq('userId', req.user.id);

      if (!familyMembers || familyMembers.length === 0) {
        return res.json([]);
      }

      const familyIds = familyMembers.map(m => m.familyId);

      // 获取记录
      let query = supabase
        .from('FeedingRecord')
        .select('*')
        .in('familyId', familyIds)
        .gte('feedingTime', startDate.toISOString())
        .lte('feedingTime', endDate.toISOString());

      if (babyId) {
        query = query.eq('babyId', babyId);
      }

      const { data: records } = await query;

      // 获取宝宝信息
      const babyIds = [...new Set(records?.map(r => r.babyId) || [])];
      const { data: babies } = await supabase
        .from('Baby')
        .select('id, name')
        .in('id', babyIds);

      const babyMap = new Map(babies?.map(b => [b.id, b.name]) || []);

      // 按宝宝分组统计
      const babyStatsMap = new Map();

      records?.forEach(record => {
        const babyId = record.babyId;
        if (!babyStatsMap.has(babyId)) {
          babyStatsMap.set(babyId, {
            babyId,
            babyName: babyMap.get(babyId) || 'Unknown',
            totalAmount: 0,
            totalFeedings: 0,
            lastFeedingTime: null,
            feedingsByType: {
              breast: 0,
              formula: 0,
              solid: 0,
            },
          });
        }

        const stats = babyStatsMap.get(babyId);
        stats.totalFeedings += 1;

        if (record.feedingType === 'formula' && record.amount) {
          stats.totalAmount += record.amount;
        } else if (record.feedingType === 'breast' && record.amount) {
          stats.totalAmount += record.amount;
        } else if (record.feedingType === 'breast' && !record.amount) {
          stats.totalAmount += 120;
        }

        stats.feedingsByType[record.feedingType] += 1;

        if (!stats.lastFeedingTime || new Date(record.feedingTime) > new Date(stats.lastFeedingTime)) {
          stats.lastFeedingTime = record.feedingTime;
        }
      });

      const result = Array.from(babyStatsMap.values());
      return res.json(result);
    }

    // 使用 Prisma
    if (!prisma) {
      return res.status(500).json({ error: '数据库未配置' });
    }

    const where = {
      feedingTime: {
        gte: startDate,
        lte: endDate,
      },
      baby: {
        family: {
          members: {
            some: {
              userId: req.user.id,
            },
          },
        },
      },
    };

    if (babyId) {
      where.babyId = babyId;
    }

    const records = await prisma.feedingRecord.findMany({
      where,
      include: {
        baby: true,
      },
    });

    // 按宝宝分组统计
    const babyStatsMap = new Map();

    records.forEach(record => {
      const babyId = record.babyId;
      if (!babyStatsMap.has(babyId)) {
        babyStatsMap.set(babyId, {
          babyId,
          babyName: record.baby.name,
          totalAmount: 0,
          totalFeedings: 0,
          lastFeedingTime: null,
          feedingsByType: {
            breast: 0,
            formula: 0,
            solid: 0,
          },
        });
      }

      const stats = babyStatsMap.get(babyId);
      stats.totalFeedings += 1;

      if (record.feedingType === 'formula' && record.amount) {
        stats.totalAmount += record.amount;
      } else if (record.feedingType === 'breast' && record.amount) {
        stats.totalAmount += record.amount;
      } else if (record.feedingType === 'breast' && !record.amount) {
        stats.totalAmount += 120;
      }

      stats.feedingsByType[record.feedingType] += 1;

      if (!stats.lastFeedingTime || new Date(record.feedingTime) > new Date(stats.lastFeedingTime)) {
        stats.lastFeedingTime = record.feedingTime;
      }
    });

    const result = Array.from(babyStatsMap.values());

    res.json(result);
  } catch (error) {
    console.error('Get daily stats error:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
};

export const getTrend = async (req, res) => {
  try {
    const { startDate, endDate, babyIds, groupBy = 'hour' } = req.query;

    console.log('getTrend called:', { startDate, endDate, babyIds, groupBy, userId: req.user?.id });

    if (!startDate || !endDate) {
      return res.status(400).json({ error: '缺少日期参数' });
    }

    // 使用 Supabase
    if (supabase) {
      console.log('Using Supabase for getTrend');
      // 获取用户的家庭
      const { data: familyMembers, error: familyError } = await supabase
        .from('FamilyMember')
        .select('familyId')
        .eq('userId', req.user.id);

      if (familyError) {
        console.error('Error fetching family members:', familyError);
        throw familyError;
      }

      console.log('Family members:', familyMembers);

      if (!familyMembers || familyMembers.length === 0) {
        return res.json([]);
      }

      const familyIds = familyMembers.map(m => m.familyId);

      // 获取宝宝列表
      let babyQuery = supabase
        .from('Baby')
        .select('id, name, gender')
        .in('familyId', familyIds)
        .order('createdAt', { ascending: true });

      // 如果指定了 babyIds，筛选特定宝宝
      if (babyIds) {
        const ids = Array.isArray(babyIds) ? babyIds : [babyIds];
        babyQuery = babyQuery.in('id', ids);
      }

      const { data: babies, error: babyError } = await babyQuery;

      if (babyError) {
        console.error('Error fetching babies:', babyError);
        throw babyError;
      }

      console.log('Babies:', babies);

      if (!babies || babies.length === 0) {
        return res.json([]);
      }

      // 获取喂养记录
      let recordQuery = supabase
        .from('FeedingRecord')
        .select('*')
        .in('familyId', familyIds)
        .gte('feedingTime', new Date(startDate).toISOString())
        .lte('feedingTime', new Date(endDate + 'T23:59:59.999Z').toISOString())
        .order('feedingTime', { ascending: true });

      // 如果指定了 babyIds，筛选特定宝宝
      if (babyIds) {
        const ids = Array.isArray(babyIds) ? babyIds : [babyIds];
        recordQuery = recordQuery.in('babyId', ids);
      }

      const { data: records, error: recordError } = await recordQuery;

      if (recordError) {
        console.error('Error fetching records:', recordError);
        throw recordError;
      }

      console.log('Records count:', records?.length);

      // 一次性获取所有宝宝近3天的母乳记录（有量的）
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const babyIdList = babies.map(b => b.id);
      const { data: recentBreastRecords, error: breastError } = await supabase
        .from('FeedingRecord')
        .select('babyId, amount')
        .in('babyId', babyIdList)
        .eq('feedingType', 'breast')
        .not('amount', 'is', null)
        .gte('feedingTime', threeDaysAgo.toISOString());

      if (breastError) {
        console.error('Error fetching breast records:', breastError);
        throw breastError;
      }

      console.log('Breast records count:', recentBreastRecords?.length);

      // 按宝宝计算平均值
      const breastAverages = {};
      babyIdList.forEach(babyId => {
        const babyRecords = recentBreastRecords?.filter(r => r.babyId === babyId) || [];
        if (babyRecords.length === 0) {
          breastAverages[babyId] = 120;
        } else {
          const total = babyRecords.reduce((sum, r) => sum + r.amount, 0);
          breastAverages[babyId] = Math.round(total / babyRecords.length);
        }
      });

      console.log('Breast averages:', breastAverages);

      if (groupBy === 'day') {
        // 按天统计
        const start = new Date(startDate);
        const end = new Date(endDate);
        const dayCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        
        const trendData = Array.from({ length: dayCount }, (_, index) => {
          const date = new Date(start);
          date.setDate(date.getDate() + index);
          return {
            date: date.toISOString().split('T')[0],
            babies: babies.map(baby => ({
              babyId: baby.id,
              babyName: baby.name,
              babyGender: baby.gender,
              amount: 0,
            })),
          };
        });

        records?.forEach(record => {
          const recordDate = new Date(record.feedingTime).toISOString().split('T')[0];
          const dayData = trendData.find(d => d.date === recordDate);
          
          if (dayData) {
            let amount = 0;
            if (record.feedingType === 'formula' && record.amount) {
              amount = record.amount;
            } else if (record.feedingType === 'breast') {
              amount = record.amount || breastAverages[record.babyId] || 120;
            }

            const babyData = dayData.babies.find(b => b.babyId === record.babyId);
            if (babyData) {
              babyData.amount += amount;
            }
          }
        });

        return res.json(trendData);
      } else {
        // 按小时统计
        const trendData = Array.from({ length: 24 }, (_, hour) => ({
          hour,
          babies: babies.map(baby => ({
            babyId: baby.id,
            babyName: baby.name,
            babyGender: baby.gender,
            amount: 0,
          })),
        }));

        records?.forEach(record => {
          const hour = new Date(record.feedingTime).getHours();
          let amount = 0;

          if (record.feedingType === 'formula' && record.amount) {
            amount = record.amount;
          } else if (record.feedingType === 'breast') {
            amount = record.amount || breastAverages[record.babyId] || 120;
          }

          const babyData = trendData[hour].babies.find(b => b.babyId === record.babyId);
          if (babyData) {
            babyData.amount += amount;
          }
        });

        return res.json(trendData);
      }
    }

    // 使用 Prisma
    if (!prisma) {
      return res.status(500).json({ error: '数据库未配置' });
    }

    const where = {
      feedingTime: {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59.999Z'),
      },
      baby: {
        family: {
          members: {
            some: {
              userId: req.user.id,
            },
          },
        },
      },
    };

    if (babyIds) {
      const ids = Array.isArray(babyIds) ? babyIds : [babyIds];
      where.babyId = { in: ids };
    }

    const records = await prisma.feedingRecord.findMany({
      where,
      include: {
        baby: true,
      },
      orderBy: {
        feedingTime: 'asc',
      },
    });

    const babies = await prisma.baby.findMany({
      where: {
        family: {
          members: {
            some: {
              userId: req.user.id,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // 计算每个宝宝近3天母乳的平均值
    const getBreastAverage = async (babyId) => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const recentRecords = await prisma.feedingRecord.findMany({
        where: {
          babyId,
          feedingType: 'breast',
          amount: { not: null },
          feedingTime: { gte: threeDaysAgo },
        },
        select: { amount: true },
      });

      if (recentRecords.length === 0) return 120; // 默认值
      
      const total = recentRecords.reduce((sum, r) => sum + r.amount, 0);
      return Math.round(total / recentRecords.length);
    };

    // 为每个宝宝预先计算母乳平均值
    const breastAverages = {};
    for (const baby of babies) {
      breastAverages[baby.id] = await getBreastAverage(baby.id);
    }

    if (groupBy === 'day') {
      // 按天统计
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dayCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      const trendData = Array.from({ length: dayCount }, (_, index) => {
        const date = new Date(start);
        date.setDate(date.getDate() + index);
        return {
          date: date.toISOString().split('T')[0],
          babies: babies.map(baby => ({
            babyId: baby.id,
            babyName: baby.name,
            babyGender: baby.gender,
            amount: 0,
          })),
        };
      });

      records.forEach(record => {
        const recordDate = new Date(record.feedingTime).toISOString().split('T')[0];
        const dayData = trendData.find(d => d.date === recordDate);
        
        if (dayData) {
          let amount = 0;
          if (record.feedingType === 'formula' && record.amount) {
            amount = record.amount;
          } else if (record.feedingType === 'breast') {
            amount = record.amount || breastAverages[record.babyId] || 120;
          }

          const babyData = dayData.babies.find(b => b.babyId === record.babyId);
          if (babyData) {
            babyData.amount += amount;
          }
        }
      });

      res.json(trendData);
    } else {
      // 按小时统计
      const trendData = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        babies: babies.map(baby => ({
          babyId: baby.id,
          babyName: baby.name,
          babyGender: baby.gender,
          amount: 0,
        })),
      }));

      records.forEach(record => {
        const hour = new Date(record.feedingTime).getHours();
        let amount = 0;

        if (record.feedingType === 'formula' && record.amount) {
          amount = record.amount;
        } else if (record.feedingType === 'breast') {
          amount = record.amount || breastAverages[record.babyId] || 120;
        }

        const babyData = trendData[hour].babies.find(b => b.babyId === record.babyId);
        if (babyData) {
          babyData.amount += amount;
        }
      });

      res.json(trendData);
    }
  } catch (error) {
    console.error('Get trend error:', error);
    res.status(500).json({ error: '获取趋势数据失败' });
  }
};
