/**
 * 检查用户的tokenRefreshTime状态
 * 
 * 使用方法：
 * node src/scripts/check-token-refresh-time.js [email]
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkTokenRefreshTime(userEmail) {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    let query = {};
    if (userEmail) {
      query = { email: userEmail };
      console.log(`\n🔍 Checking user: ${userEmail}`);
    } else {
      console.log('\n🔍 Checking all users...');
    }
    
    const users = await usersCollection.find(query).toArray();
    
    if (users.length === 0) {
      console.log('❌ No users found');
      return;
    }
    
    console.log(`\n📊 Found ${users.length} user(s):`);
    console.log(''.padEnd(80, '='));
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. Email: ${user.email}`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Role: ${user.role || 'user'}`);
      console.log(`   Status: ${user.status || 'active'}`);
      
      if (user.tokenRefreshTime) {
        const refreshTime = new Date(user.tokenRefreshTime);
        const now = new Date();
        const diff = now - refreshTime;
        const diffHours = Math.floor(diff / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        console.log(`   TokenRefreshTime: ${refreshTime.toISOString()}`);
        console.log(`   Last refreshed: ${diffHours}h ${diffMinutes}m ago`);
        
        if (diff < 24 * 60 * 60 * 1000) {
          console.log(`   Status: ✅ Recent (within 24h)`);
        } else {
          console.log(`   Status: ⚠️ Old (older than 24h)`);
        }
      } else {
        console.log(`   TokenRefreshTime: ❌ NOT SET`);
        console.log(`   Status: 🚨 NEEDS MIGRATION`);
      }
    });
    
    // 统计信息
    const withRefreshTime = users.filter(u => u.tokenRefreshTime).length;
    const withoutRefreshTime = users.length - withRefreshTime;
    
    console.log('\n'.padEnd(80, '='));
    console.log('📈 Summary:');
    console.log(`   Total users: ${users.length}`);
    console.log(`   With tokenRefreshTime: ${withRefreshTime} ✅`);
    console.log(`   Without tokenRefreshTime: ${withoutRefreshTime} ${withoutRefreshTime > 0 ? '🚨' : '✅'}`);
    
  } catch (error) {
    console.error('Check failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\nMongoDB connection closed');
  }
}

// 获取命令行参数
const userEmail = process.argv[2];

// 运行检查
if (require.main === module) {
  checkTokenRefreshTime(userEmail)
    .then(() => {
      console.log('\n✅ Check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkTokenRefreshTime };