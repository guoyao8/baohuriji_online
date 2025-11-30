import prisma from '../config/database.js';

// 获取提醒设置
export const getReminderSettings = async (req, res) => {
  try {
    const { babyId } = req.query;

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
