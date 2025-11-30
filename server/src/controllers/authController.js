import prisma from '../config/database.js';
import supabase from '../config/supabase.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';
import { v4 as uuidv4 } from 'uuid';

export const register = async (req, res) => {
  try {
    const { username, password, inviteCode } = req.body;

    console.log('注册请求:', { username, hasPassword: !!password, inviteCode, useSupabase: !!supabase });

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const hashedPassword = await hashPassword(password);
    const userId = uuidv4();
    const familyId = uuidv4();

    // 使用 Supabase 客户端
    if (supabase) {
      console.log('使用 Supabase REST API');

      // 检查用户是否存在
      const { data: existingUser } = await supabase
        .from('User')
        .select('id')
        .eq('username', username)
        .single();

      if (existingUser) {
        return res.status(400).json({ error: '用户名已存在' });
      }

      // 创建用户
      const { data: user, error: userError } = await supabase
        .from('User')
        .insert({
          id: userId,
          username,
          password: hashedPassword,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select('id, username, avatarUrl, createdAt')
        .single();

      if (userError) throw userError;

      // 创建家庭
      const { error: familyError } = await supabase
        .from('Family')
        .insert({
          id: familyId,
          name: `${username}的家庭`,
          createdBy: userId,
          createdAt: new Date().toISOString(),
        });

      if (familyError) throw familyError;

      // 添加家庭成员
      const { error: memberError } = await supabase
        .from('FamilyMember')
        .insert({
          id: uuidv4(),
          familyId: familyId,
          userId: userId,
          role: 'admin',
          nickname: username,
          joinedAt: new Date().toISOString(),
        });

      if (memberError) throw memberError;

      const token = generateToken(userId);

      console.log('注册完成 (Supabase)');
      return res.status(201).json({ token, user });
    }

    // 使用 Prisma（降级方案）
    if (!prisma) {
      return res.status(500).json({ error: '数据库未配置' });
    }

    console.log('使用 Prisma');
    console.log('检查用户是否存在...');
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    console.log('创建用户...');
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

    console.log('用户创建成功:', user.id);

    // 创建家庭
    console.log('创建新家庭...');
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
    console.log('家庭创建成功:', family.id);

    const token = generateToken(user.id);

    console.log('注册完成 (Prisma)');
    res.status(201).json({
      token,
      user,
    });
  } catch (error) {
    console.error('Register error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    res.status(500).json({ 
      error: '注册失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('登录请求:', { username, useSupabase: !!supabase });

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    // 使用 Supabase
    if (supabase) {
      console.log('使用 Supabase REST API');

      const { data: user, error } = await supabase
        .from('User')
        .select('id, username, password, avatarUrl, createdAt')
        .eq('username', username)
        .single();

      if (error || !user) {
        console.log('用户未找到:', error);
        return res.status(401).json({ error: '用户名或密码错误' });
      }

      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: '用户名或密码错误' });
      }

      const token = generateToken(user.id);

      console.log('登录成功 (Supabase)');
      return res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
        },
      });
    }

    // 使用 Prisma（降级方案）
    if (!prisma) {
      return res.status(500).json({ error: '数据库未配置' });
    }

    console.log('使用 Prisma');
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

    console.log('登录成功 (Prisma)');
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

    // 使用 Supabase
    if (supabase) {
      const { data: user, error } = await supabase
        .from('User')
        .update({ 
          avatarUrl,
          updatedAt: new Date().toISOString() 
        })
        .eq('id', req.user.id)
        .select('id, username, avatarUrl, createdAt')
        .single();

      if (error) throw error;

      return res.json(user);
    }

    // 使用 Prisma
    if (!prisma) {
      return res.status(500).json({ error: '数据库未配置' });
    }

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
