import { useState, useEffect } from 'react';
import './App.css';

const emptyPatient = { name: '', phone: '', age: '', gender: 'Male' };
const emptyDoctor = { name: '', specialty: '', phone: '', email: '' };
const emptyAppointment = { patient: '', doctor: '', date: '', time: '' };

function App() {
  const [page, setPage] = useState('Dashboard');

  const [patients, setPatients] = useState(() =>
    JSON.parse(localStorage.getItem('medicare_patients') || '[]')
  );
  const [appointments, setAppointments] = useState(() =>
    JSON.parse(localStorage.getItem('medicare_appointments') || '[]')
  );
  const [doctors, setDoctors] = useState(() =>
    JSON.parse(localStorage.getItem('medicare_doctors') || '[]')
  );
  const [settings, setSettings] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('medicare_settings') || 'null');
    return saved || { clinicName: 'MediCare', adminName: 'Administrator' };
  });

  const [patientForm, setPatientForm] = useState(emptyPatient);
  const [doctorForm, setDoctorForm] = useState(emptyDoctor);
  const [appointmentForm, setAppointmentForm] = useState(emptyAppointment);

  const [editingPatientId, setEditingPatientId] = useState(null);
  const [editingDoctorId, setEditingDoctorId] = useState(null);

  const [patientSearch, setPatientSearch] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [apptSearch, setApptSearch] = useState('');
  const [apptStatus, setApptStatus] = useState('All');
  const [apptDate, setApptDate] = useState('');

  useEffect(() => {
    localStorage.setItem('medicare_patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('medicare_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('medicare_doctors', JSON.stringify(doctors));
  }, [doctors]);

  useEffect(() => {
    localStorage.setItem('medicare_settings', JSON.stringify(settings));
  }, [settings]);

  const today = new Date().toLocaleDateString('en-CA');

  // Patients

  const savePatient = (e) => {
    e.preventDefault();

    if (editingPatientId) {
      const old = patients.find(p => p.id === editingPatientId);

      setPatients(prev =>
        prev.map(p => (p.id === editingPatientId ? { ...p, ...patientForm } : p))
      );

      // Keep appointments in sync if the name changed
      if (old && old.name !== patientForm.name) {
        setAppointments(prev =>
          prev.map(a =>
            a.patient === old.name ? { ...a, patient: patientForm.name } : a
          )
        );
      }

      setEditingPatientId(null);
    } else {
      setPatients(prev => [...prev, { id: Date.now(), ...patientForm }]);
    }

    setPatientForm(emptyPatient);
  };

  const startEditPatient = (p) => {
    setEditingPatientId(p.id);
    setPatientForm({
      name: p.name,
      phone: p.phone,
      age: p.age,
      gender: p.gender
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditPatient = () => {
    setEditingPatientId(null);
    setPatientForm(emptyPatient);
  };

  const deletePatient = (id) => {
    if (!window.confirm('Delete this patient?')) return;
    setPatients(prev => prev.filter(p => p.id !== id));
    if (editingPatientId === id) cancelEditPatient();
  };

  // Doctors

  const saveDoctor = (e) => {
    e.preventDefault();

    if (editingDoctorId) {
      const old = doctors.find(d => d.id === editingDoctorId);

      setDoctors(prev =>
        prev.map(d => (d.id === editingDoctorId ? { ...d, ...doctorForm } : d))
      );

      if (old && old.name !== doctorForm.name) {
        setAppointments(prev =>
          prev.map(a =>
            a.doctor === old.name ? { ...a, doctor: doctorForm.name } : a
          )
        );
      }

      setEditingDoctorId(null);
    } else {
      setDoctors(prev => [...prev, { id: Date.now(), ...doctorForm }]);
    }

    setDoctorForm(emptyDoctor);
  };

  const startEditDoctor = (d) => {
    setEditingDoctorId(d.id);
    setDoctorForm({
      name: d.name,
      specialty: d.specialty,
      phone: d.phone,
      email: d.email || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditDoctor = () => {
    setEditingDoctorId(null);
    setDoctorForm(emptyDoctor);
  };

  const deleteDoctor = (id) => {
    if (!window.confirm('Delete this doctor?')) return;
    setDoctors(prev => prev.filter(d => d.id !== id));
    if (editingDoctorId === id) cancelEditDoctor();
  };

  // Appointments

  // Returns a message if the slot conflicts, otherwise null.
  // excludeId lets us ignore the appointment being edited.
  const findConflict = (doctor, patient, date, time, excludeId = null) => {
    const active = appointments.filter(
      a => a.status !== 'Cancelled' && a.id !== excludeId
    );

    if (active.some(a => a.doctor === doctor && a.date === date && a.time === time)) {
      return 'This doctor already has an appointment at this date and time.';
    }

    if (active.some(a => a.patient === patient && a.date === date && a.time === time)) {
      return 'This patient already has an appointment at this date and time.';
    }

    return null;
  };

  const addAppointment = (e) => {
    e.preventDefault();

    const conflict = findConflict(
      appointmentForm.doctor,
      appointmentForm.patient,
      appointmentForm.date,
      appointmentForm.time
    );

    if (conflict) {
      alert(conflict);
      return;
    }

    setAppointments(prev => [
      ...prev,
      { id: Date.now(), ...appointmentForm, status: 'Scheduled' }
    ]);

    setAppointmentForm(emptyAppointment);
  };

  const updateAppointmentStatus = (id, status) => {
    if (status !== 'Cancelled') {
      const current = appointments.find(a => a.id === id);

      if (current) {
        const conflict = findConflict(
          current.doctor,
          current.patient,
          current.date,
          current.time,
          id
        );

        if (conflict) {
          alert(conflict);
          return;
        }
      }
    }

    setAppointments(prev =>
      prev.map(item => (item.id === id ? { ...item, status } : item))
    );
  };

  const deleteAppointment = (id) => {
    if (!window.confirm('Delete this appointment?')) return;
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  // Settings

  const exportData = () => {
    const data = { patients, doctors, appointments, settings };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'medicare-backup.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetAllData = () => {
    if (!window.confirm('Delete ALL patients, doctors and appointments? This cannot be undone.')) return;
    setPatients([]);
    setDoctors([]);
    setAppointments([]);
    cancelEditPatient();
    cancelEditDoctor();
  };

  // Derived lists

  const sortedAppointments = [...appointments].sort((a, b) =>
    (a.date + a.time).localeCompare(b.date + b.time)
  );

  const todayCount = appointments.filter(
    a => a.date === today && a.status !== 'Cancelled'
  ).length;

  const upcoming = sortedAppointments
    .filter(a => a.status === 'Scheduled' && a.date >= today)
    .slice(0, 5);

  const filteredPatients = patients.filter(p => {
    const q = patientSearch.trim().toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.phone.includes(q);
  });

  const filteredDoctors = doctors.filter(d => {
    const q = doctorSearch.trim().toLowerCase();
    return (
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.specialty.toLowerCase().includes(q)
    );
  });

  const filteredAppointments = sortedAppointments.filter(a => {
    const q = apptSearch.trim().toLowerCase();
    const matchesText =
      !q ||
      a.patient.toLowerCase().includes(q) ||
      a.doctor.toLowerCase().includes(q);
    const matchesStatus = apptStatus === 'All' || a.status === apptStatus;
    const matchesDate = !apptDate || a.date === apptDate;
    return matchesText && matchesStatus && matchesDate;
  });

  const menuItems = ['Dashboard', 'Patients', 'Appointments', 'Doctors', 'Settings'];

  return (
    <div className="app-container">

      <aside className="sidebar">
        <h2 className="logo">{settings.clinicName}<span>.</span></h2>

        <p className="menu-title">MAIN MENU</p>

        <nav>
          {menuItems.map(item => (
            <button
              key={item}
              className={page === item ? 'menu-item active' : 'menu-item'}
              onClick={() => setPage(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">Clinic Management System</div>
      </aside>

      <main className="main-content">

        <header className="topbar">
          <div>
            <h2>{page}</h2>
            <p>Welcome to {settings.clinicName} Management System</p>
          </div>

          <div className="admin-profile">
            <div className="avatar">
              {(settings.adminName || 'A').charAt(0).toUpperCase()}
            </div>
            <span>{settings.adminName}</span>
          </div>
        </header>

        {/* Dashboard */}

        {page === 'Dashboard' && (
          <section>

            <div className="welcome-card">
              <div>
                <h1>Welcome to {settings.clinicName}</h1>
                <p>Manage your clinic efficiently and easily.</p>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <p>Total Patients</p>
                <h2>{patients.length}</h2>
                <span>Registered Patients</span>
              </div>

              <div className="stat-card">
                <p>Total Appointments</p>
                <h2>{appointments.length}</h2>
                <span>All Appointments</span>
              </div>

              <div className="stat-card">
                <p>Total Doctors</p>
                <h2>{doctors.length}</h2>
                <span>Registered Doctors</span>
              </div>

              <div className="stat-card">
                <p>Today's Appointments</p>
                <h2>{todayCount}</h2>
                <span>Scheduled Today</span>
              </div>
            </div>

            <div className="section-card">
              <h3>Upcoming Appointments</h3>

              {upcoming.length === 0 ? (
                <p>No upcoming appointments.</p>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Doctor</th>
                        <th>Date</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcoming.map(a => (
                        <tr key={a.id}>
                          <td>{a.patient}</td>
                          <td>{a.doctor}</td>
                          <td>{a.date}</td>
                          <td>{a.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="section-card">
              <h3>Recent Patients</h3>

              {patients.length === 0 ? (
                <p>No patients registered yet.</p>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Age</th>
                        <th>Gender</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.slice(-5).reverse().map(p => (
                        <tr key={p.id}>
                          <td>{p.name}</td>
                          <td>{p.phone}</td>
                          <td>{p.age}</td>
                          <td>{p.gender}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </section>
        )}

        {/* Patients */}

        {page === 'Patients' && (
          <section className="section-card">

            <h2>Patient Management</h2>

            <form className="patient-form" onSubmit={savePatient}>

              <h3>{editingPatientId ? 'Edit Patient' : 'Register New Patient'}</h3>

              <input
                placeholder="Patient Name"
                required
                value={patientForm.name}
                onChange={e => setPatientForm({ ...patientForm, name: e.target.value })}
              />

              <input
                placeholder="Phone Number"
                required
                value={patientForm.phone}
                onChange={e => setPatientForm({ ...patientForm, phone: e.target.value })}
              />

              <input
                type="number"
                placeholder="Age"
                min="0"
                required
                value={patientForm.age}
                onChange={e => setPatientForm({ ...patientForm, age: e.target.value })}
              />

              <select
                value={patientForm.gender}
                onChange={e => setPatientForm({ ...patientForm, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>

              <div className="form-actions">
                <button className="primary-btn" type="submit">
                  {editingPatientId ? 'Save Changes' : '+ Add Patient'}
                </button>

                {editingPatientId && (
                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={cancelEditPatient}
                  >
                    Cancel
                  </button>
                )}
              </div>

            </form>

            <h3>Patients List ({filteredPatients.length})</h3>

            <div className="toolbar">
              <input
                className="search-input"
                placeholder="Search by name or phone..."
                value={patientSearch}
                onChange={e => setPatientSearch(e.target.value)}
              />
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPatients.map(p => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.phone}</td>
                      <td>{p.age}</td>
                      <td>{p.gender}</td>
                      <td>
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => startEditPatient(p)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => deletePatient(p.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredPatients.length === 0 && (
                    <tr>
                      <td colSpan="5">
                        {patients.length === 0 ? 'No patients yet' : 'No matching patients'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </section>
        )}

        {/* Doctors */}

        {page === 'Doctors' && (
          <section className="section-card">

            <h2>Doctor Management</h2>
            <p className="welcome-text">Manage your clinic medical staff.</p>

            <form className="patient-form" onSubmit={saveDoctor}>

              <h3>{editingDoctorId ? 'Edit Doctor' : 'Register New Doctor'}</h3>

              <input
                placeholder="Doctor Name"
                required
                value={doctorForm.name}
                onChange={e => setDoctorForm({ ...doctorForm, name: e.target.value })}
              />

              <input
                placeholder="Medical Specialty"
                required
                value={doctorForm.specialty}
                onChange={e => setDoctorForm({ ...doctorForm, specialty: e.target.value })}
              />

              <input
                placeholder="Phone Number"
                required
                value={doctorForm.phone}
                onChange={e => setDoctorForm({ ...doctorForm, phone: e.target.value })}
              />

              <input
                type="email"
                placeholder="Email Address"
                value={doctorForm.email}
                onChange={e => setDoctorForm({ ...doctorForm, email: e.target.value })}
              />

              <div className="form-actions">
                <button className="primary-btn" type="submit">
                  {editingDoctorId ? 'Save Changes' : '+ Add Doctor'}
                </button>

                {editingDoctorId && (
                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={cancelEditDoctor}
                  >
                    Cancel
                  </button>
                )}
              </div>

            </form>

            <h3>Doctors List ({filteredDoctors.length})</h3>

            <div className="toolbar">
              <input
                className="search-input"
                placeholder="Search by name or specialty..."
                value={doctorSearch}
                onChange={e => setDoctorSearch(e.target.value)}
              />
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Doctor Name</th>
                    <th>Specialty</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                 {filteredDoctors.length === 0 && (
                    <tr>
                      <td colSpan="5">
                        {doctors.length === 0
                          ? 'No doctors registered yet.'
                          : 'No matching doctors'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </section>
        )}

        {/* Appointments */}

        {page === 'Appointments' && (
          <section className="section-card">

            <h2>Appointment Management</h2>

            <form className="patient-form" onSubmit={addAppointment}>

              <h3>Book New Appointment</h3>

              <select
                required
                value={appointmentForm.patient}
                onChange={e => setAppointmentForm({ ...appointmentForm, patient: e.target.value })}
              >
                <option value="">Select Patient</option>
                {patients.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>

              <select
                required
                value={appointmentForm.doctor}
                onChange={e => setAppointmentForm({ ...appointmentForm, doctor: e.target.value })}
              >
                <option value="">Select Doctor</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.name}>
                    {d.name} - {d.specialty}
                  </option>
                ))}
              </select>

              <input
                type="date"
                required
                min={today}
                value={appointmentForm.date}
                onChange={e => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
              />

              <input
                type="time"
                required
                value={appointmentForm.time}
                onChange={e => setAppointmentForm({ ...appointmentForm, time: e.target.value })}
              />

              <button
                className="primary-btn"
                type="submit"
                disabled={patients.length === 0 || doctors.length === 0}
              >
                + Book Appointment
              </button>

            </form>

            {doctors.length === 0 && (
              <p className="welcome-text">
                Please register a doctor before booking an appointment.
              </p>
            )}

            <h3>Appointments List ({filteredAppointments.length})</h3>

            <div className="toolbar">
              <input
                className="search-input"
                placeholder="Search by patient or doctor..."
                value={apptSearch}
                onChange={e => setApptSearch(e.target.value)}
              />

              <select value={apptStatus} onChange={e => setApptStatus(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <input
                type="date"
                value={apptDate}
                onChange={e => setApptDate(e.target.value)}
              />

              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setApptSearch('');
                  setApptStatus('All');
                  setApptDate('');
                }}
              >
                Clear Filters
              </button>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAppointments.map(item => (
                    <tr key={item.id}>
                      <td>{item.patient}</td>
                      <td>{item.doctor}</td>
                      <td>{item.date}</td>
                      <td>{item.time}</td>
                      <td>
                        <select
                          value={item.status}
                          onChange={e => updateAppointmentStatus(item.id, e.target.value)}
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => deleteAppointment(item.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredAppointments.map(item => (
                    <tr key={item.id}>
                      <td>{item.patient}</td>
                      <td>{item.doctor}</td>
                      <td>{item.date}</td>
                      <td>{item.time}</td>
                      <td>
                        <select
                          value={item.status}
                          onChange={e => updateAppointmentStatus(item.id, e.target.value)}
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => deleteAppointment(item.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredAppointments.length === 0 && (
                    <tr>
                      <td colSpan="6">
                        {appointments.length === 0
                          ? 'No appointments yet.'
                          : 'No matching appointments'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </section>
        )}

        {/* Settings */}

        {page === 'Settings' && (
          <section className="section-card">

            <h2>Settings</h2>

            <div className="settings-group">
              <h3>Clinic Profile</h3>

              <label>Clinic name</label>
              <input
                value={settings.clinicName}
                onChange={e => setSettings({ ...settings, clinicName: e.target.value })}
              />

              <label>Administrator name</label>
              <input
                value={settings.adminName}
                onChange={e => setSettings({ ...settings, adminName: e.target.value })}
              />

              <p className="welcome-text">Changes are saved automatically.</p>
            </div>

            <div className="settings-group">
              <h3>Data</h3>

              <button type="button" className="primary-btn" onClick={exportData}>
                Download Backup
              </button>

              <button type="button" className="danger-btn" onClick={resetAllData}>
                Delete All Data
              </button>
            </div>

          </section>
        )}

      </main>
    </div>
  );
}

export default App;