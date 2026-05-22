const bcrypt = require('bcrypt');
const store = require('./store');

async function seed() {
  const username = process.argv[2] || 'admin';
  const password = process.argv[3] || 'admin123456';

  try {
    const hash = await bcrypt.hash(password, 10);

    const existing = store.findAdminByUsername(username);
    if (existing) {
      store.updateAdmin(existing.id, { password_hash: hash });
      console.log(`✅ 管理员 ${username} 密码已重置`);
    } else {
      store.createAdmin(username, hash, 'super_admin');
      console.log(`✅ 超级管理员 ${username} 创建成功`);
    }

    console.log(`   用户名: ${username}`);
    console.log(`   密码:   ${password}`);
    console.log(`   请登录后立即修改密码！`);
  } catch (err) {
    console.error('❌ 创建管理员失败:', err.message);
    process.exit(1);
  }
}

seed();
