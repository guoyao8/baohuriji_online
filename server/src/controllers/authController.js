import prisma from '../config/database.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';

export const register = async (req, res) => {
  try {
    const { username, password, inviteCode } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    let familyId;

    // 如果提供了邀请码，尝试加入家庭
    if (inviteCode) {
      const family = await prisma.family.findFirst({
        where: { inviteCode },
      });

      console.log('邀请码查询结果:', inviteCode, family ? '找到家庭' : '未找到家庭');

      if (family) {
        // 加入已有家庭
        await prisma.familyMember.create({
          data: {
            familyId: family.id,
            userId: user.id,
            role: 'member',
            nickname: username,
          },
        });
        familyId = family.id;
        console.log('用户成功加入家庭:', family.id, family.name);
      } else {
        // 邀请码无效，创建自己的家庭
        console.log('邀请码无效，创建新家庭');
        const newFamily = await prisma.family.create({
          data: {
            name: `${username}的家庭`,
            createdBy: user.id,
            members: {
              create: {
                userId: user.id,
                role: 'admin',
                nickname: username,
              },
            },
          },
        });
        familyId = newFamily.id;
      }
    } else {
      // 没有邀请码，自动创建家庭
      const family = await prisma.family.create({
        data: {
          name: `${username}的家庭`,
          createdBy: user.id,
          members: {
            create: {
              userId: user.id,
              role: 'admin',
              nickname: username,
            },
          },
        },
      });
      familyId = family.id;
    }

    const token = generateToken(user.id);

    res.status(201).json({
      token,
      user,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '注册失败' });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录失败' });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ error: '获取用户信息失败' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { avatarUrl } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: '更新用户信息失败' });
  }
};
