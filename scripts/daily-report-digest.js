require('dotenv').config();
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const REPORTS_DIR = './reports';
const ARCHIVE_DIR = './reports/archive';

// Get today's date in YYYY-MM-DD format
const getToday = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// Get all report files from today
const getTodaysReports = () => {
  const today = getToday();
  
  if (!fs.existsSync(REPORTS_DIR)) {
    console.log('No reports directory found.');
    return [];
  }

  const files = fs.readdirSync(REPORTS_DIR).filter(file => {
    return file.endsWith('.json') && file.includes(today);
  });

  return files.map(file => {
    const filePath = path.join(REPORTS_DIR, file);
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return { file, path: filePath, content };
    } catch (error) {
      console.error(`Error reading ${file}:`, error.message);
      return null;
    }
  }).filter(Boolean);
};

// Archive processed reports
const archiveReports = (reports) => {
  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  }

  reports.forEach(report => {
    const archivePath = path.join(ARCHIVE_DIR, report.file);
    fs.renameSync(report.path, archivePath);
    console.log(`Archived: ${report.file}`);
  });
};

// Generate HTML digest
const generateDigestHtml = (reports, date) => {
  const statusEmoji = {
    'COMPLETED': '✅',
    'PARTIAL': '🟡',
    'BLOCKED': '🔴',
    'FAILED': '❌'
  };

  const typeColors = {
    'NEW FEATURE': '#4CAF50',
    'BUG FIX': '#f44336',
    'REFACTOR': '#9C27B0',
    'PERFORMANCE': '#FF9800',
    'SECURITY': '#E91E63',
    'DEVOPS': '#2196F3'
  };

  // Group reports by project
  const byProject = reports.reduce((acc, { content }) => {
    const project = content.report.project;
    if (!acc[project]) acc[project] = [];
    acc[project].push(content.report);
    return acc;
  }, {});

  // Calculate summary stats
  const totalTasks = reports.length;
  const completed = reports.filter(r => r.content.report.status === 'COMPLETED').length;
  const partial = reports.filter(r => r.content.report.status === 'PARTIAL').length;
  const blocked = reports.filter(r => r.content.report.status === 'BLOCKED').length;
  const failed = reports.filter(r => r.content.report.status === 'FAILED').length;

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .container { background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 15px; }
        .summary-box { display: flex; gap: 15px; margin: 20px 0; flex-wrap: wrap; }
        .stat { background: #f8f9fa; padding: 15px 25px; border-radius: 8px; text-align: center; min-width: 100px; }
        .stat-number { font-size: 28px; font-weight: bold; color: #333; }
        .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .project-section { margin: 30px 0; }
        .project-header { background: #333; color: white; padding: 12px 20px; border-radius: 8px 8px 0 0; font-size: 18px; }
        .task-card { border: 1px solid #e0e0e0; border-top: none; padding: 20px; }
        .task-card:last-child { border-radius: 0 0 8px 8px; }
        .task-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .task-id { font-weight: bold; font-size: 16px; }
        .task-type { padding: 4px 12px; border-radius: 20px; font-size: 11px; color: white; text-transform: uppercase; }
        .task-meta { color: #666; font-size: 13px; margin-bottom: 10px; }
        .task-summary { background: #f8f9fa; padding: 12px; border-radius: 5px; margin: 10px 0; }
        .files-list { font-size: 13px; margin: 10px 0; }
        .files-list code { background: #e8e8e8; padding: 2px 6px; border-radius: 3px; }
        .blockers { background: #ffebee; border-left: 4px solid #f44336; padding: 10px 15px; margin: 10px 0; }
        .next-steps { background: #e3f2fd; border-left: 4px solid #2196F3; padding: 10px 15px; margin: 10px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📊 Daily Development Digest</h1>
        <p style="color: #666;">Report for ${date}</p>
        
        <div class="summary-box">
          <div class="stat">
            <div class="stat-number">${totalTasks}</div>
            <div class="stat-label">Total Tasks</div>
          </div>
          <div class="stat" style="border-left: 4px solid #4CAF50;">
            <div class="stat-number" style="color: #4CAF50;">${completed}</div>
            <div class="stat-label">Completed</div>
          </div>
          <div class="stat" style="border-left: 4px solid #FF9800;">
            <div class="stat-number" style="color: #FF9800;">${partial}</div>
            <div class="stat-label">Partial</div>
          </div>
          <div class="stat" style="border-left: 4px solid #f44336;">
            <div class="stat-number" style="color: #f44336;">${blocked}</div>
            <div class="stat-label">Blocked</div>
          </div>
          <div class="stat" style="border-left: 4px solid #9C27B0;">
            <div class="stat-number" style="color: #9C27B0;">${failed}</div>
            <div class="stat-label">Failed</div>
          </div>
        </div>
  `;

  // Generate project sections
  for (const [project, tasks] of Object.entries(byProject)) {
    html += `
      <div class="project-section">
        <div class="project-header">📁 ${project}</div>
    `;

    tasks.forEach(task => {
      const emoji = statusEmoji[task.status] || '❓';
      const typeColor = typeColors[task.type] || '#666';

      html += `
        <div class="task-card">
          <div class="task-header">
            <span class="task-id">${emoji} ${task.task_id}</span>
            <span class="task-type" style="background: ${typeColor};">${task.type}</span>
          </div>
          <div class="task-meta">
            <strong>${task.agent_role}</strong> • ${task.timestamp}
          </div>
          <div class="task-summary">${task.summary}</div>
      `;

      if (task.files_created && task.files_created.length > 0) {
        html += `
          <div class="files-list">
            <strong>📄 Files Created:</strong><br>
            ${task.files_created.map(f => `<code>${f.path}</code> - ${f.description}`).join('<br>')}
          </div>
        `;
      }

      if (task.files_modified && task.files_modified.length > 0) {
        html += `
          <div class="files-list">
            <strong>✏️ Files Modified:</strong><br>
            ${task.files_modified.map(f => `<code>${f.path}</code> [${f.action}] - ${f.description}`).join('<br>')}
          </div>
        `;
      }

      if (task.tests && task.tests.written > 0) {
        html += `
          <div class="files-list">
            <strong>🧪 Tests:</strong> ${task.tests.written} written, ${task.tests.passing} passing, ${task.tests.failing} failing
          </div>
        `;
      }

      if (task.dependencies_added && task.dependencies_added.length > 0) {
        html += `
          <div class="files-list">
            <strong>📦 Dependencies Added:</strong> <code>${task.dependencies_added.join('</code>, <code>')}</code>
          </div>
        `;
      }

      if (task.blockers && task.blockers.length > 0 && task.blockers[0] !== '') {
        html += `
          <div class="blockers">
            <strong>🚫 Blockers:</strong><br>
            ${task.blockers.map(b => `• ${b}`).join('<br>')}
          </div>
        `;
      }

      if (task.next_steps && task.next_steps.length > 0 && task.next_steps[0] !== '') {
        html += `
          <div class="next-steps">
            <strong>➡️ Next Steps:</strong><br>
            ${task.next_steps.map(s => `• ${s}`).join('<br>')}
          </div>
        `;
      }

      html += `</div>`;
    });

    html += `</div>`;
  }

  html += `
        <div class="footer">
          Generated by Orchestrator Daily Digest System<br>
          ${reports.length} report(s) processed and archived
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
};

// Configure email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });
};

// Main function
async function sendDailyDigest() {
  const today = getToday();
  console.log(`\n📊 Generating daily digest for ${today}...`);

  const reports = getTodaysReports();

  if (reports.length === 0) {
    console.log('No reports found for today. Skipping email.');
    return;
  }

  console.log(`Found ${reports.length} report(s) for today.`);

  // Validate environment variables
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD || !process.env.REPORT_EMAIL_TO) {
    console.error('❌ Missing required environment variables. Please check your .env file.');
    console.error('Required: EMAIL_USER, EMAIL_APP_PASSWORD, REPORT_EMAIL_TO');
    process.exit(1);
  }

  try {
    const transporter = createTransporter();
    const html = generateDigestHtml(reports, today);

    // Create JSON attachment with all reports
    const allReportsJson = reports.map(r => r.content);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.REPORT_EMAIL_TO,
      subject: `📊 Daily Dev Digest - ${today} - ${reports.length} Task(s)`,
      html: html,
      attachments: [
        {
          filename: `daily-digest-${today}.json`,
          content: JSON.stringify(allReportsJson, null, 2)
        }
      ]
    });

    console.log(`✅ Daily digest sent successfully to ${process.env.REPORT_EMAIL_TO}`);

    // Archive the processed reports
    archiveReports(reports);
    console.log(`📁 ${reports.length} report(s) archived.`);

  } catch (error) {
    console.error('❌ Error sending daily digest:', error.message);
    process.exit(1);
  }
}

// Run if called directly
sendDailyDigest();
