// Note: per user request, persistence (localStorage) is documented but NOT enabled.
// To enable, uncomment the localStorage lines and adapt secure handling for passwords.


const demoUsers = [
  {id:1,name:'Admin',email:'admin@example.com',password:'pass123',role:'admin'},
  {id:2,name:'Patient',email:'patient@example.com',password:'pass123',role:'patient'}
];
const savedResults = [];

let currentUser = null;
let lastReport = null;


const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const view = $('#view');
const toastBox = $('#toast');

function toast(msg, ms=2500){
  toastBox.textContent = msg;
  toastBox.classList.remove('hidden');
  toastBox.classList.add('fade-in');
  setTimeout(()=>{ toastBox.classList.add('hidden'); }, ms);
}

// ---------- Routing ----------
function render(route){

  $$('.nav-btn, .menu-btn').forEach(b=>b.classList.remove('active'));
  $$('.nav-btn[data-route="'+route+'"], .menu-btn[data-route="'+route+'"]').forEach(b=>b.classList.add('active'));

  switch(route){
    case 'home': renderHome(); break;
    case 'signup': renderSignup(); break;
    case 'login': renderLogin(); break;
    case 'patient': renderPatient(); break;
    case 'diagnose': renderDiagnose(); break;
    case 'history': renderHistory(); break;
    case 'admin': renderAdmin(); break;
    default: renderHome(); break;
  }
}


$$('.nav-btn').forEach(b=>b.addEventListener('click', ()=>render(b.dataset.route)));
$$('.menu-btn').forEach(b=>b.addEventListener('click', ()=>render(b.dataset.route)));
$('#themeToggle').addEventListener('click', toggleTheme);
$('#printLast').addEventListener('click', ()=>{ if(lastReport) openPrintable(lastReport); else toast('No last result to print') });
$('#exportAll').addEventListener('click', exportCSV);

// ---------- Views ----------
function renderHome(){
  view.innerHTML = `
    <div class="view-head">
      <div>
        <h2>Welcome to LabDiag</h2>
        <div class="muted">A modern laboratory diagnostic workflow.</div>
      </div>
      <div>
        <div class="tag small">Mock up</div>
      </div>
    </div>

    <div style="margin-top:12px;display:grid;grid-template-columns:1fr 300px;gap:12px">
      <div class="card fade-in">
        <h3>How it works</h3>
        <ol class="muted">
          <li>Signup or login as patient or admin (credentials available).</li>
          <li>Patients pick symptoms and run diagnosis.</li>
          <li>Save results (in-memory) and print reports.</li>
          <li>Admin can view results and export CSV.</li>
        </ol>
      </div>

      <div class="card fade-in">
        <h3>Mock up credentials</h3>
        <p class="muted">Admin: <strong>admin@example.com</strong> / pass123</p>
        <p class="muted">Patient: <strong>patient@example.com</strong> / pass123</p>
      </div>
    </div>
  `;
}

function renderSignup(){
  view.innerHTML = `
    <h2>Create account</h2>
    <form id="signupForm" class="form">
      <div class="row">
        <div class="col"><input style="padding: 9px; border-radius: 50px;" id="suName" placeholder="Full name" required></div>
        <div class="col"><input style="padding: 9px; border-radius: 50px;" id="suPhone" placeholder="Phone (optional)"></div>
      </div>
      <input style="padding: 9px; border-radius: 50px;" id="suEmail" type="email" placeholder="Email" required>
      <input style="padding: 9px; border-radius: 50px;" id="suPass" type="password" placeholder="Password" required>
      <select style="padding: 9px; border-radius: 50px;" id="suRole"><option value="patient">Patient</option><option value="admin">Admin</option></select>
      <div style="display:flex;gap:8px">
        <button type="submit" class="btn">Create account</button>
        <button type="button" class="btn ghost" onclick="render('login')">Have an account?</button>
      </div>
    </form>
  `;
  $('#signupForm').addEventListener('submit', e=>{
    e.preventDefault();
    const name = $('#suName').value.trim(), email = $('#suEmail').value.trim(), pass = $('#suPass').value, role = $('#suRole').value;
    if(!name||!email||!pass) return toast('Please fill required fields');
    const id = demoUsers.length+1;
    demoUsers.push({id,name,email,password:pass,role});
    // To persist locally: uncomment the next line and adjust accordingly:
    // localStorage.setItem('labdiag_users', JSON.stringify(demoUsers));
    toast('Account created (demo). You can now login.');
    render('login');
  });
}

function renderLogin(){
  view.innerHTML = `
    <h2>Login</h2>
    <form id="loginForm" class="form">
      <input style="padding: 9px; border-radius: 50px;" id="liEmail" type="email" placeholder="Email" required>
      <input style="padding: 9px; border-radius: 50px;" id="liPass" type="password" placeholder="Password" required>
      <div style="display:flex;gap:8px">
        <button type="submit" class="btn">Login</button>
        <button type="button" class="btn ghost" onclick="render('signup')">Create account</button>
      </div>
    </form>
  `;
  $('#loginForm').addEventListener('submit', e=>{
    e.preventDefault();
    const email = $('#liEmail').value.trim(), pass = $('#liPass').value;
    const found = demoUsers.find(u=>u.email===email && u.password===pass);
    if(!found) return toast('Invalid credentials. Try admin@example.com / pass123');
    currentUser = found;
    // update UI
    $('.avatar').textContent = currentUser.name ? currentUser.name[0].toUpperCase() : 'U';
    $('#sidebarName').textContent = currentUser.name || currentUser.email;
    // Admin menu
    if(currentUser.role==='admin') $$('.admin-only').forEach(el=>el.classList.remove('hidden'));
    toast('Welcome, '+currentUser.name);
    render(currentUser.role==='admin' ? 'admin' : 'patient');
  });
}

function renderPatient(){
  if(!currentUser) return toast('Please login first'), render('login');
  view.innerHTML = `
    <div class="view-head">
      <h2>Patient Portal</h2>
      <div class="muted">Welcome, ${currentUser.name || currentUser.email}</div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 420px;gap:12px;margin-top:12px">
      <div class="card">
        <h3>Run a quick diagnosis</h3>
        <form id="diagForm" class="form">
          <div class="row">
            <div class="col"><input style="padding: 9px; border-radius: 50px;" id="age" placeholder="Age"></div>
            <div class="col"><select style="padding: 9px; border-radius: 50px;" id="gender"><option>Prefer not to say</option><option>Female</option><option>Male</option></select></div>
          </div>

          <label class="muted">Choose symptoms</label>
          <div class="symptoms" id="symList">
            <label class="symptom"><input type="checkbox" value="fever"> Fever</label>
            <label class="symptom"><input type="checkbox" value="cough"> Cough</label>
            <label class="symptom"><input type="checkbox" value="sore_throat"> Sore throat</label>
            <label class="symptom"><input type="checkbox" value="headache"> Headache</label>
            <label class="symptom"><input type="checkbox" value="fatigue"> Fatigue</label>
            <label class="symptom"><input type="checkbox" value="nausea"> Nausea</label>
            <label class="symptom"><input type="checkbox" value="diarrhea"> Diarrhea</label>
            <label class="symptom"><input type="checkbox" value="shortness_of_breath"> Shortness of breath</label>
          </div>

          <div style="display:flex;gap:8px;margin-top:8px">
            <button type="button" class="btn" id="doDiagnose">Diagnose</button>
            <button type="button" class="btn ghost" id="resetDiag">Reset</button>
          </div>
        </form>
      </div>

      <div class="card">
        <h3>Diagnosis result</h3>
        <div id="resultBox" class="result"><em class="muted">No diagnosis yet.</em></div>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button id="printBtn" class="btn ghost">Print</button>
          <button id="saveBtn" class="btn">Save result</button>
        </div>
      </div>
    </div>

    <div style="margin-top:14px" class="card">
      <h3>My Results</h3>
      <table id="resultsTable">
        <thead><tr><th>Date</th><th>Symptoms</th><th>Diagnosis</th><th></th></tr></thead>
        <tbody><tr><td colspan="4" class="muted">No saved results yet.</td></tr></tbody>
      </table>
    </div>
  `;

  // attach handlers
  $('#doDiagnose').addEventListener('click', ()=>{
    const checked = Array.from(document.querySelectorAll('#symList input:checked')).map(i=>i.value);
    const age = $('#age').value, gender = $('#gender').value;
    if(checked.length===0) return toast('Select at least one symptom');
    const out = diagnoseEngine(checked, {age,gender,when:new Date().toISOString()});
    renderResult(out);
  });

  $('#resetDiag').addEventListener('click', ()=>{ $$('#symList input').forEach(i=>i.checked=false); $('#resultBox').innerHTML='<em class="muted">No diagnosis yet.</em>'; lastReport=null; });

  $('#printBtn').addEventListener('click', ()=>{ if(lastReport) openPrintable(lastReport); else toast('No report to print') });
  $('#saveBtn').addEventListener('click', ()=> {
    if(!lastReport) return toast('No diagnosis to save');
    const rec = {id:savedResults.length+1, when:new Date().toISOString(), patient: currentUser.email, symptoms:lastReport.symptoms, diagnosis:lastReport.results[0].name, confidence:lastReport.results[0].confidence};
    savedResults.push(rec);
    // to persist locally: localStorage.setItem('labdiag_results', JSON.stringify(savedResults));
    toast('Result saved.');
    renderResultsTable();
  });

  renderResultsTable();
}

function renderResultsTable(){
  const tbody = $('#resultsTable tbody');
  tbody.innerHTML = '';
  const mine = savedResults.filter(r => r.patient === currentUser.email);
  if(mine.length===0) { tbody.innerHTML = '<tr><td colspan="4" class="muted">No saved results yet.</td></tr>'; return; }
  mine.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${new Date(r.when).toLocaleString()}</td><td>${r.symptoms.join(', ')}</td><td>${r.diagnosis} <div class="muted">(${r.confidence}%)</div></td><td><button class="btn ghost" onclick="window.print()">Print</button></td>`;
    tbody.appendChild(tr);
  });
}

function renderDiagnose(){ renderPatient(); }

function renderHistory(){ renderPatient(); }

function renderAdmin(){
  if(!currentUser || currentUser.role!=='admin') return toast('Admin only');
  view.innerHTML = `
    <h2>Admin Dashboard</h2>
    <div style="display:grid;grid-template-columns:1fr 320px;gap:12px">
      <div class="card">
        <h3>Patients & Results</h3>
        <table id="patientsTable"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr></thead><tbody></tbody></table>
      </div>
      <div class="card">
        <h3>Tools</h3>
        <p class="muted">Export or clear data.</p>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn ghost" onclick="exportCSV()">Export CSV</button>
          <button class="btn ghost" onclick="clearDemo()">Clear Demo Data</button>
        </div>
      </div>
    </div>
  `;
  renderPatientsTable();
}

function renderPatientsTable(){
  const tbody = $('#patientsTable tbody');
  tbody.innerHTML = '';
  demoUsers.forEach(u=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${u.name}</td><td>${u.email}</td><td>${u.role}</td><td><button class="btn ghost" onclick="alert('Contact ${u.email}')">Contact</button></td>`;
    tbody.appendChild(tr);
  });
}

// ---------- Diagnosis engine (simple rule-based) ----------
function diagnoseEngine(symptoms, meta){
  const s = new Set(symptoms);
  const results = [];
  if(s.has('fever') && s.has('cough') && s.has('sore_throat')) results.push({name:'Upper Respiratory Infection (possible viral)',confidence:78});
  if(s.has('fever') && s.has('nausea') && s.has('diarrhea')) results.push({name:'Gastroenteritis',confidence:72});
  if(s.has('headache') && s.has('nausea')) results.push({name:'Migraine',confidence:65});
  if(s.has('shortness_of_breath')) results.push({name:'Respiratory distress — seek urgent care',confidence:90});
  if(results.length===0){
    if(s.has('cough') && s.has('fatigue')) results.push({name:'Bronchitis or mild infection',confidence:55});
    else if(s.has('headache')) results.push({name:'Tension headache',confidence:40});
    else results.push({name:'No strong match — consult a clinician',confidence:30});
  }
  results.sort((a,b)=>b.confidence-a.confidence);
  return {meta, symptoms:Array.from(s), results};
}

function renderResult(payload){
  const c = payload.results[0];
  const sym = payload.symptoms.join(', ');
  const html = `
    <h3>${c.name}</h3>
    <div class="muted">Confidence: <span class="tag">${c.confidence}%</span></div>
    <div style="margin-top:8px;color:var(--muted)">Symptoms: ${sym}</div>
    <div style="margin-top:8px;color:var(--muted);font-size:13px">Note: suggestion — seek professional care for diagnosis.</div>
  `;
  $('#resultBox').innerHTML = html;
  lastReport = {payload, chosen:c, when:new Date().toISOString()};
  // prepare printable content in JS (openPrintable uses this)
}

function openPrintable(report){
  // create a printable window
  const w = window.open('', '_blank', 'width=800,height=600');
  const content = `
    <html><head><title>Diagnosis Report</title>
    <style>body{font-family:Arial,Helvetica,sans-serif;padding:20px;color:#04203a} .tag{background:#eee;padding:4px 8px;border-radius:6px}</style>
    </head><body>
    <h1>Diagnosis Report</h1>
    <div><strong>Patient:</strong> ${currentUser?currentUser.name: 'Guest'}</div>
    <div><strong>When:</strong> ${new Date().toLocaleString()}</div>
    <div><strong>Symptoms:</strong> ${report.payload.symptoms.join(', ')}</div>
    <hr>
    <h2>${report.chosen.name}</h2>
    <div>Confidence: <span class="tag">${report.chosen.confidence}%</span></div>
    <p style="margin-top:12px;color:#334155">Generated by LabDiag.</p>
    </body></html>
  `;
  w.document.write(content);
  w.document.close();
  w.focus();
}

function exportCSV(){
  if(savedResults.length===0) return toast('No data to export');
  const rows = [['id','when','patient','symptoms','diagnosis','confidence']];
  savedResults.forEach(r=>rows.push([r.id,r.when, r.patient, `"${r.symptoms.join('|')}"`, r.diagnosis, r.confidence]));
  const csv = rows.map(r=>r.join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='labdiag_export.csv'; a.click(); URL.revokeObjectURL(url);
  toast('CSV exported');
}

function clearDemo(){ if(confirm('Clear data (in-memory)?')){ demoUsers.splice(0,demoUsers.length); savedResults.splice(0,savedResults.length); toast('Cleared data. Refresh to reset defaults.'); }}

// ---------- Theme toggle ----------
function toggleTheme(){
  document.documentElement.classList.toggle('light');
  toast('Theme toggled');
}

// ---------- Init ----------
(function init(){
  // If you wanted to restore from localStorage, here's how (disabled):
  // const users = JSON.parse(localStorage.getItem('labdiag_users') || 'null');
  // if(users) { demoUsers.splice(0,demoUsers.length); demoUsers.push(...users); }

  render('home');
  // small accessibility improvements:
  $$('.nav-btn').forEach(b=>b.addEventListener('keydown', (e)=>{ if(e.key==='Enter') b.click(); }));
})();
