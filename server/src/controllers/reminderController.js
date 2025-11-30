import prisma from '../config/database.js';
import supabase from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid';

// 获取提醒设置
export const getReminderSettings = async (req, res) => {
  try {
    const { babyId } = req.query;

    // 使用 Supabase
    if (supabase) {
      // 获取用户的家庭
      const { data: familyMember } = await supabase
        .from('FamilyMember')
        .select('familyId')
        .eq('userId', req.user.id)
        .limit(1)
        .single();

      if (!familyMember) {
        return res.status(404).json({ error: '用户不属于任何家庭' });
      }

      // 查找提醒设置
      let query = supabase
        .from('ReminderSettings')
        .select('*')
        .eq('familyId', familyMember.familyId);

      if (babyId) {
        query = query.eq('babyId', babyId);
      } else {
        query = query.is('babyId', null);
      }

      const { data: settings } = await query.limit(1).single();

      // 如果没有设置，返回默认值
      if (!settings) {
        return res.json({
          enabled: true,
          intervalHours: 3,
          intervalMinutes: 0,
          reminderMethod: 'both',
          ringtone: 'default',
        });
      }

      return res.json(settings);
    }

    // 使用 Prisma
    if (!prisma) {
      return res.status(500).json({ error: '数据库未配置' });
    }

    // 获取用户的家庭
    const familyMember = await prisma.familyMember.findFirst({
      where: { userId: req.user.id },
    });

    if (!familyMember) {
      return res.status(404).json({ error: '用户不属于任何家庭' });
    }

    // 查找提醒设置
    const settings = await prisma.reminderSettings.findFirst({
      where: {
        familyId: familyMember.familyId,
        babyId: babyId || null,
      },
    });

    // 如果没有设置，返回默认值
    if (!settings) {
      return res.json({
        enabled: true,
        intervalHours: 3,
        intervalMinutes: 0,
        reminderMethod: 'both',
        ringtone: 'default',
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Get reminder settings error:', error);
    res.status(500).json({ error: '获取提醒设置失败' });
  }
};

// 保存或更新提醒设置
export const saveReminderSettings = async (req, res) => {
  try {
    const { babyId, enabled, intervalHours, intervalMinutes, reminderMethod, ringtone } = req.body;

    // 使用 Supabase
    if (supabase) {
      // 获取用户的家庭
      const { data: familyMember } = await supabase
        .from('FamilyMember')
        .select('familyId')
        .eq('userId', req.user.id)
        .limit(1)
        .single();

      if (!familyMember) {
        return res.status(404).json({ error: '用户不属于任何家庭' });
      }

      // 如果指定了babyId，验证宝宝是否属于该家庭
      if (babyId) {
        const { data: baby } = await supabase
          .from('Baby')
          .select('id')
          .eq('id', babyId)
          .eq('familyId', familyMember.familyId)
          .single();

        if (!baby) {
          return res.status(404).json({ error: '宝宝不存在' });
        }
      }

      // 查找现有设置
      let query = supabase
        .from('ReminderSettings')
        .select('id')
        .eq('familyId', familyMember.familyId);

      if (babyId) {
        query = query.eq('babyId', babyId);
      } else {
        query = query.is('babyId', null);
      }

      const { data: existingSettings } = await query.limit(1).single();

      const settingsData = {
        enabled: enabled !== undefined ? enabled : true,
        intervalHours: intervalHours !== undefined ? intervalHours : 3,
        intervalMinutes: intervalMinutes !== undefined ? intervalMinutes : 0,
        reminderMethod: reminderMethod || 'both',
        ringtone: ringtone || 'default',
        updatedAt: new Date().toISOString(),
      };

      let settings;
      if (existingSettings) {
        // 更新
        const { data, error } = await supabase
          .from('ReminderSettings')
          .update(settingsData)
          .eq('id', existingSettings.id)
          .select()
          .single();

        if (error) throw error;
        settings = data;
      } else {
        // 创建
        const { data, error } = await supabase
          .from('ReminderSettings')
          .insert({
            id: uuidv4(),
            familyId: familyMember.familyId,
            babyId: babyId || null,
            ...settingsData,
            createdAt: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        settings = data;
      }

      return res.json(settings);
    }

    // 使用 Prisma
    if (!prisma) {
      return res.status(500).json({ error: '数据库未配置' });
    }

    // 获取用户的家庭
    const familyMember = await prisma.familyMember.findFirst({
      where: { userId: req.user.id },
    });

    if (!familyMember) {
      return res.status(404).json({ error: '用户不属于任何家庭' });
    }

    // 如果指定了babyId，验证宝宝是否属于该家庭
    if (babyId) {
      const baby = await prisma.baby.findFirst({
        where: {
          id: babyId,
          familyId: familyMember.familyId,
        },
      });

      if (!baby) {
        return res.status(404).json({ error: '宝宝不存在' });
      }
    }

    // 使用 upsert 创建或更新
    const settings = await prisma.reminderSettings.upsert({
      where: {
        familyId_babyId: {
          familyId: familyMember.familyId,
          babyId: babyId || null,
        },
      },
      update: {
        enabled: enabled !== undefined ? enabled : true,
        intervalHours: intervalHours !== undefined ? intervalHours : 3,
        intervalMinutes: intervalMinutes !== undefined ? intervalMinutes : 0,
        reminderMethod: reminderMethod || 'both',
        ringtone: ringtone || 'default',
      },
      create: {
        familyId: familyMember.familyId,
        babyId: babyId || null,
        enabled: enabled !== undefined ? enabled : true,
        intervalHours: intervalHours !== undefined ? intervalHours : 3,
        intervalMinutes: intervalMinutes !== undefined ? intervalMinutes : 0,
        reminderMethod: reminderMethod || 'both',
        ringtone: ringtone || 'default',
      },
    });

    res.json(settings);
  } catch (error) {
    console.error('Save reminder settings error:', error);
    res.status(500).json({ error: '保存提醒设置失败' });
  }
};
