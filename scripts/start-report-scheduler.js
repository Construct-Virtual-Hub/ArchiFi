require('dotenv').config();
const cron = require('node-cron');
const { execSync } = require('child_process');
const path = require('path');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║           📅 ARCHIFI REPORT SCHEDULER STARTED              ║');
console.log('╠════════════════════════════════════════════════════════════╣');
console.log(`║ 📧 Reports will be sent to: ${(process.env.REPORT_EMAIL_TO || 'NOT SET').padEnd(28)} ║`);
console.log('║ ⏰ Scheduled time: 23:59 daily                             ║');
console.log(`║ 🌍 Timezone: ${(process.env.TIMEZONE || 'UTC').padEnd(44)} ║`);
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');

// Validate environment
if (!process.env.REPORT_EMAIL_TO) {
  console.warn('⚠️  WARNING: REPORT_EMAIL_TO not set in .env file');
}

// Schedule for 23:59 every day
cron.schedule('59 23 * * *', () => {
  const timestamp = new Date().toISOString();
  console.log(`\n🕐 [${timestamp}] Running daily digest...`);
  try {
    execSync('node scripts/daily-report-digest.js', { 
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });
  } catch (error) {
    console.error('Error running digest:', error.message);
  }
}, {
  timezone: process.env.TIMEZONE || 'UTC'
});

// Also allow manual trigger via SIGUSR1 (kill -USR1 <pid>)
process.on('SIGUSR1', () => {
  console.log('\n📬 Manual trigger received, running digest now...');
  try {
    execSync('node scripts/daily-report-digest.js', { 
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });
  } catch (error) {
    console.error('Error running digest:', error.message);
  }
});

console.log('Scheduler is running. Press Ctrl+C to stop.');
console.log('Tip: Run "npm run send-digest-now" to manually trigger a digest.\n');

// Keep the process alive
process.stdin.resume();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Scheduler stopped. Goodbye!');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Scheduler terminated. Goodbye!');
  process.exit(0);
});
