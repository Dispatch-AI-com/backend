/**
 * 数据库迁移脚本：为现有用户添加tokenRefreshTime字段
 * 
 * 使用方法：
 * node src/scripts/migrate-token-refresh-time.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function migrateTokenRefreshTime() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // 查找没有tokenRefreshTime字段的用户
    const usersWithoutTokenRefreshTime = await usersCollection.countDocuments({
      tokenRefreshTime: { $exists: false }
    });
    
    console.log(`Found ${usersWithoutTokenRefreshTime} users without tokenRefreshTime`);
    
    if (usersWithoutTokenRefreshTime === 0) {
      console.log('All users already have tokenRefreshTime field');
      return;
    }
    
    // 为所有缺少tokenRefreshTime的用户添加该字段
    const result = await usersCollection.updateMany(
      { tokenRefreshTime: { $exists: false } },
      { 
        $set: { 
          tokenRefreshTime: new Date() // 设置为当前时间
        }
      }
    );
    
    console.log(`Migration completed:`);
    console.log(`- Matched documents: ${result.matchedCount}`);
    console.log(`- Modified documents: ${result.modifiedCount}`);
    
    // 验证迁移结果
    const remainingCount = await usersCollection.countDocuments({
      tokenRefreshTime: { $exists: false }
    });
    
    if (remainingCount === 0) {
      console.log('✅ Migration successful - all users now have tokenRefreshTime');
    } else {
      console.warn(`⚠️ ${remainingCount} users still missing tokenRefreshTime`);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// 运行迁移
if (require.main === module) {
  migrateTokenRefreshTime()
    .then(() => {
      console.log('Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateTokenRefreshTime };