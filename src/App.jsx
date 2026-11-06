import { useState, useEffect } from 'react';
import './App.css';

const emptyPatient = { name: '', phone: '', age: '', gender: 'Male' };
const emptyDoctor = { name: '', specialty: '', phone: '', email: '' };
const emptyAppointment = { patient: '', doctor: '', date: '', time: '' };

const pageLabels = {
  Dashboard: 'لوحة التحكم',
  Patients: 'المرضى',
  Appointments: 'المواعيد',
  Doctors: 'الأطباء',
  Settings: 'الإعدادات'
};

const statusLabels = {
  Scheduled: 'مجدول',
  Completed: 'مكتمل',
  Cancelled: 'ملغي'
};

const genderLabels = {
  Male: 'ذكر',
  Female: 'أنثى'
};

const menuItems = ['Dashboard', 'Patients', 'Appointments', 'Doctors', 'Settings'];

const formatDate = (d) =>
  d
    ? new Date(d + 'T00:00:00').toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '';

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
    if (!saved) return { clinicName: 'ميديكير', adminName: 'المدير' };
    return {
      ...saved,
      adminName: saved.adminName === 'Administrator' ? 'المدير' : saved.adminName
    };
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

  // المرضى

  const savePatient = (e) => {
    e.preventDefault();

    if (editingPatientId) {
      const old = patients.find(p => p.id === editingPatientId);

      setPatients(prev =>
        prev.map(p => (p.id === editingPatientId ? { ...p, ...patientForm } : p))
      );

      // تحديث الاسم في المواعيد إذا تغيّر
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
    if (!window.confirm('هل تريد حذف هذا المريض؟')) return;
    setPatients(prev => prev.filter(p => p.id !== id));
    if (editingPatientId === id) cancelEditPatient();
  };

  // الأطباء

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
    if (!window.confirm('هل تريد حذف هذا الطبيب؟')) return;
    setDoctors(prev => prev.filter(d => d.id !== id));
    if (editingDoctorId === id) cancelEditDoctor();
  };

  // المواعيد

  // ترجع رسالة إذا كان هناك تعارض، وإلا null
  const findConflict = (doctor, patient, date, time, excludeId = null) => {
    const active = appointments.filter(
      a => a.status !== 'Cancelled' && a.id !== excludeId
    );

    if (active.some(a => a.doctor === doctor && a.date === date && a.time === time)) {
      return 'هذا الطبيب لديه موعد آخر في نفس التاريخ والوقت.';
    }

    if (active.some(a => a.patient === patient && a.date === date && a.time === time)) {
      return 'هذا المريض لديه موعد آخر في نفس التاريخ والوقت.';
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
    if (!window.confirm('هل تريد حذف هذا الموعد؟')) return;
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  // الإعدادات

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
    if (!window.confirm('سيتم حذف كل المرضى والأطباء والمواعيد نهائياً. هل أنت متأكد؟')) return;
    setPatients([]);
    setDoctors([]);
    setAppointments([]);
    cancelEditPatient();
    cancelEditDoctor();
  };

  // القوائم المحسوبة

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

  return (
    <div className="app-container" dir="rtl" lang="ar">

      <aside className="sidebar">
        <h2 className="logo">{settings.clinicName}<span>.</span></h2>

        <p className="menu-title">القائمة الرئيسية</p>

        <nav>
          {menuItems.map(item => (
            <button
              key={item}
              className={page === item ? 'menu-item active' : 'menu-item'}
              onClick={() => setPage(item)}
            >
              {pageLabels[item]}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">نظام إدارة العيادة</div>
      </aside>

      <main className="main-content">

        <header className="topbar">
          <div>
            <h2>{pageLabels[page]}</h2>
            <p>مرحباً بك في نظام إدارة {settings.clinicName}</p>
          </div>

          <div className="admin-profile">
            <div className="avatar">
              {(settings.adminName || 'م').charAt(0).toUpperCase()}
            </div>
            <span>{settings.adminName}</span>
          </div>
        </header>

        {/* لوحة التحكم */}

        {page === 'Dashboard' && (
          <section>

            <div className="welcome-card">
              <div>
                <h1>مرحباً بك في {settings.clinicName}</h1>
                <p>أدر عيادتك بسهولة وكفاءة.</p>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <p>إجمالي المرضى</p>
                <h2>{patients.length}</h2>
                <span>المرضى المسجلون</span>
              </div>

              <div className="stat-card">
                <p>إجمالي المواعيد</p>
                <h2>{appointments.length}</h2>
                <span>كل المواعيد</span>
              </div>

              <div className="stat-card">
                <p>إجمالي الأطباء</p>
                <h2>{doctors.length}</h2>
                <span>الأطباء المسجلون</span>
              </div>

              <div className="stat-card">
                <p>مواعيد اليوم</p>
                <h2>{todayCount}</h2>
                <span>مجدولة اليوم</span>
              </div>
            </div>

            <div className="section-card">
              <h3>المواعيد القادمة</h3>

              {upcoming.length === 0 ? (
                <p>لا توجد مواعيد قادمة.</p>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>المريض</th>
                        <th>الطبيب</th>
                        <th>التاريخ</th>
                        <th>الوقت</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcoming.map(a => (
                        <tr key={a.id}>
                          <td>{a.patient}</td>
                          <td>{a.doctor}</td>
                          <td>{formatDate(a.date)}</td>
                          <td>{a.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="section-card">
              <h3>أحدث المرضى</h3>

              {patients.length === 0 ? (
                <p>لا يوجد مرضى مسجلون بعد.</p>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>الاسم</th>
                        <th>الهاتف</th>
                        <th>العمر</th>
                        <th>الجنس</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.slice(-5).reverse().map(p => (
                        <tr key={p.id}>
                          <td>{p.name}</td>
                          <td>{p.phone}</td>
                          <td>{p.age}</td>
                          <td>{genderLabels[p.gender] || p.gender}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </section>
        )}

        {/* المرضى */}

        {page === 'Patients' && (
          <section className="section-card">

            <h2>إدارة المرضى</h2>

            <form className="patient-form" onSubmit={savePatient}>

              <h3>{editingPatientId ? 'تعديل بيانات المريض' : 'تسجيل مريض جديد'}</h3>

              <input
                placeholder="اسم المريض"
                required
                value={patientForm.name}
                onChange={e => setPatientForm({ ...patientForm, name: e.target.value })}
              />

              <input
                placeholder="رقم الهاتف"
                required
                value={patientForm.phone}
                onChange={e => setPatientForm({ ...patientForm, phone: e.target.value })}
              />

              <input
                type="number"
                placeholder="العمر"
                min="0"
                required
                value={patientForm.age}
                onChange={e => setPatientForm({ ...patientForm, age: e.target.value })}
              />

              <select
                value={patientForm.gender}
                onChange={e => setPatientForm({ ...patientForm, gender: e.target.value })}
              >
                <option value="Male">ذكر</option>
                <option value="Female">أنثى</option>
              </select>

              <div className="form-actions">
                <button className="primary-btn" type="submit">
                  {editingPatientId ? 'حفظ التعديلات' : '+ إضافة مريض'}
                </button>

                {editingPatientId && (
                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={cancelEditPatient}
                  >
                    إلغاء
                  </button>
                )}
              </div>

            </form>

            <h3>قائمة المرضى ({filteredPatients.length})</h3>

            <div className="toolbar">
              <input
                className="search-input"
                placeholder="ابحث بالاسم أو رقم الهاتف..."
                value={patientSearch}
                onChange={e => setPatientSearch(e.target.value)}
              />
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>الاسم</th>
                    <th>الهاتف</th>
                    <th>العمر</th>
                    <th>الجنس</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPatients.map(p => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.phone}</td>
                      <td>{p.age}</td>
                      <td>{genderLabels[p.gender] || p.gender}</td>
                      <td>
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => startEditPatient(p)}
                        >
                          تعديل
                        </button>
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => deletePatient(p.id)}
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredPatients.length === 0 && (
                    <tr>
                      <td colSpan="5">
                        {patients.length === 0 ? 'لا يوجد مرضى بعد' : 'لا توجد نتائج مطابقة'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </section>
        )}

        {/* الأطباء */}

        {page === 'Doctors' && (
          <section className="section-card">

            <h2>إدارة الأطباء</h2>
            <p className="welcome-text">أدر الكادر الطبي في عيادتك.</p>

            <form className="patient-form" onSubmit={saveDoctor}>

              <h3>{editingDoctorId ? 'تعديل بيانات الطبيب' : 'تسجيل طبيب جديد'}</h3>

              <input
                placeholder="اسم الطبيب"
                required
                value={doctorForm.name}
                onChange={e => setDoctorForm({ ...doctorForm, name: e.target.value })}
              />

              <input
                placeholder="التخصص الطبي"
                required
                value={doctorForm.specialty}
                onChange={e => setDoctorForm({ ...doctorForm, specialty: e.target.value })}
              />

              <input
                placeholder="رقم الهاتف"
                required
                value={doctorForm.phone}
                onChange={e => setDoctorForm({ ...doctorForm, phone: e.target.value })}
              />

              <input
                type="email"
                placeholder="البريد الإلكتروني (اختياري)"
                value={doctorForm.email}
                onChange={e => setDoctorForm({ ...doctorForm, email: e.target.value })}
              />

              <div className="form-actions">
                <button className="primary-btn" type="submit">
                  {editingDoctorId ? 'حفظ التعديلات' : '+ إضافة طبيب'}
                </button>

                {editingDoctorId && (
                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={cancelEditDoctor}
                  >
                    إلغاء
                  </button>
                )}
              </div>

            </form>

            <h3>قائمة الأطباء ({filteredDoctors.length})</h3>

            <div className="toolbar">
              <input
                className="search-input"
                placeholder="ابحث بالاسم أو التخصص..."
                value={doctorSearch}
                onChange={e => setDoctorSearch(e.target.value)}
              />
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>اسم الطبيب</th>
                    <th>التخصص</th>
                    <th>الهاتف</th>
                    <th>البريد الإلكتروني</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDoctors.map(d => (
                    <tr key={d.id}>
                      <td>{d.name}</td>
                      <td>{d.specialty}</td>
                      <td>{d.phone}</td>
                      <td>{d.email || '-'}</td>
                      <td>
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => startEditDoctor(d)}
                        >
                          تعديل
                        </button>
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => deleteDoctor(d.id)}
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredDoctors.length === 0 && (
                    <tr>
                      <td colSpan="5">
                        {doctors.length === 0
                          ? 'لا يوجد أطباء مسجلون بعد.'
                          : 'لا توجد نتائج مطابقة'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </section>
        )}

        {/* المواعيد */}

        {page === 'Appointments' && (
          <section className="section-card">

            <h2>إدارة المواعيد</h2>

            <form className="patient-form" onSubmit={addAppointment}>

              <h3>حجز موعد جديد</h3>

              <select
                required
                value={appointmentForm.patient}
                onChange={e => setAppointmentForm({ ...appointmentForm, patient: e.target.value })}
              >
                <option value="">اختر المريض</option>
                {patients.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>

              <select
                required
                value={appointmentForm.doctor}
                onChange={e => setAppointmentForm({ ...appointmentForm, doctor: e.target.value })}
              >
                <option value="">اختر الطبيب</option>
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
                + حجز موعد
              </button>

            </form>

            {(patients.length === 0 || doctors.length === 0) && (
              <p className="welcome-text">
                يجب تسجيل مريض وطبيب واحد على الأقل قبل حجز موعد.
              </p>
            )}

            <h3>قائمة المواعيد ({filteredAppointments.length})</h3>

            <div className="toolbar">
              <input
                className="search-input"
                placeholder="ابحث باسم المريض أو الطبيب..."
                value={apptSearch}
                onChange={e => setApptSearch(e.target.value)}
              />

              <select value={apptStatus} onChange={e => setApptStatus(e.target.value)}>
                <option value="All">كل الحالات</option>
                <option value="Scheduled">مجدول</option>
                <option value="Completed">مكتمل</option>
                <option value="Cancelled">ملغي</option>
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
                مسح الفلاتر
              </button>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>المريض</th>
                    <th>الطبيب</th>
                    <th>التاريخ</th>
                    <th>الوقت</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAppointments.map(item => (
                    <tr key={item.id}>
                      <td>{item.patient}</td>
                      <td>{item.doctor}</td>
                      <td>{formatDate(item.date)}</td>
                      <td>{item.time}</td>
                      <td>
                        <select
                          value={item.status}
                          onChange={e => updateAppointmentStatus(item.id, e.target.value)}
                        >
                          <option value="Scheduled">{statusLabels.Scheduled}</option>
                          <option value="Completed">{statusLabels.Completed}</option>
                          <option value="Cancelled">{statusLabels.Cancelled}</option>
                        </select>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => deleteAppointment(item.id)}
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredAppointments.length === 0 && (
                    <tr>
                      <td colSpan="6">
                        {appointments.length === 0
                          ? 'لا توجد مواعيد بعد.'
                          : 'لا توجد نتائج مطابقة'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </section>
        )}

        {/* الإعدادات */}

        {page === 'Settings' && (
          <section className="section-card">

            <h2>الإعدادات</h2>

            <div className="settings-group">
              <h3>بيانات العيادة</h3>

              <label>اسم العيادة</label>
              <input
                value={settings.clinicName}
                onChange={e => setSettings({ ...settings, clinicName: e.target.value })}
              />

              <label>اسم المدير</label>
              <input
                value={settings.adminName}
                onChange={e => setSettings({ ...settings, adminName: e.target.value })}
              />

              <p className="welcome-text">يتم حفظ التغييرات تلقائياً.</p>
            </div>

            <div className="settings-group">
              <h3>البيانات</h3>

              <button type="button" className="primary-btn" onClick={exportData}>
                تحميل نسخة احتياطية
              </button>

              <button type="button" className="danger-btn" onClick={resetAllData}>
                حذف كل البيانات
              </button>
            </div>

          </section>
        )}

      </main>
    </div>
  );
}

export default App;
