// frontend/src/utils/data.js
// Country data with phone codes and cities

export const COUNTRIES_DATA = {
  'Saudi Arabia': {
    code: 'SA',
    phoneCode: '+966',
    cities: ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Tabuk', 'Abha', 'Taif', 'Buraidah']
  },
  'United Arab Emirates': {
    code: 'AE',
    phoneCode: '+971',
    cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Al Ain']
  },
  'Jordan': {
    code: 'JO',
    phoneCode: '+962',
    cities: ['Amman', 'Zarqa', 'Irbid', 'Aqaba', 'Madaba', 'Jerash', 'Ajloun', 'Karak', 'Salt', 'Mafraq']
  },
  'Egypt': {
    code: 'EG',
    phoneCode: '+20',
    cities: ['Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said', 'Suez', 'Luxor', 'Mansoura', 'Tanta', 'Aswan']
  },
  'Kuwait': {
    code: 'KW',
    phoneCode: '+965',
    cities: ['Kuwait City', 'Hawalli', 'Salmiya', 'Farwaniya', 'Jahra', 'Ahmadi']
  },
  'Qatar': {
    code: 'QA',
    phoneCode: '+974',
    cities: ['Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Umm Salal', 'Mesaieed']
  },
  'Bahrain': {
    code: 'BH',
    phoneCode: '+973',
    cities: ['Manama', 'Muharraq', 'Riffa', 'Hamad Town', 'Isa Town', 'Sitra']
  },
  'Oman': {
    code: 'OM',
    phoneCode: '+968',
    cities: ['Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Sur', 'Ibri', 'Barka']
  },
  'Lebanon': {
    code: 'LB',
    phoneCode: '+961',
    cities: ['Beirut', 'Tripoli', 'Sidon', 'Tyre', 'Nabatieh', 'Jounieh', 'Zahle', 'Baalbek']
  },
  'Palestine': {
    code: 'PS',
    phoneCode: '+970',
    cities: ['Gaza', 'Ramallah', 'Hebron', 'Nablus', 'Jenin', 'Bethlehem', 'Tulkarm', 'Qalqilya']
  },
  'Iraq': {
    code: 'IQ',
    phoneCode: '+964',
    cities: ['Baghdad', 'Basra', 'Mosul', 'Erbil', 'Sulaymaniyah', 'Najaf', 'Karbala', 'Kirkuk']
  },
  'Syria': {
    code: 'SY',
    phoneCode: '+963',
    cities: ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama', 'Deir ez-Zor', 'Raqqa', 'Daraa']
  },
  'Morocco': {
    code: 'MA',
    phoneCode: '+212',
    cities: ['Casablanca', 'Rabat', 'Fes', 'Marrakech', 'Tangier', 'Agadir', 'Meknes', 'Oujda']
  },
  'Algeria': {
    code: 'DZ',
    phoneCode: '+213',
    cities: ['Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Setif', 'Tlemcen']
  },
  'Tunisia': {
    code: 'TN',
    phoneCode: '+216',
    cities: ['Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte', 'Gabes', 'Ariana', 'Nabeul']
  },
  'United States': {
    code: 'US',
    phoneCode: '+1',
    cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Francisco', 'Seattle', 'Boston', 'Miami', 'Atlanta', 'Washington DC']
  },
  'United Kingdom': {
    code: 'GB',
    phoneCode: '+44',
    cities: ['London', 'Manchester', 'Birmingham', 'Glasgow', 'Liverpool', 'Leeds', 'Edinburgh', 'Bristol', 'Cardiff', 'Belfast']
  },
  'Canada': {
    code: 'CA',
    phoneCode: '+1',
    cities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Winnipeg', 'Quebec City', 'Hamilton']
  },
  'Germany': {
    code: 'DE',
    phoneCode: '+49',
    cities: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Dusseldorf', 'Dortmund', 'Essen']
  },
  'France': {
    code: 'FR',
    phoneCode: '+33',
    cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux']
  },
  'Turkey': {
    code: 'TR',
    phoneCode: '+90',
    cities: ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Gaziantep', 'Konya']
  },
  'India': {
    code: 'IN',
    phoneCode: '+91',
    cities: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur']
  },
  'Pakistan': {
    code: 'PK',
    phoneCode: '+92',
    cities: ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta']
  },
  'Australia': {
    code: 'AU',
    phoneCode: '+61',
    cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra', 'Newcastle']
  }
};

// Job titles organized by category
export const JOB_TITLES = {
  'Technology & IT': [
    'مهندس برمجيات (Software Engineer)',
    'مطور واجهات أمامية (Frontend Developer)',
    'مطور واجهات خلفية (Backend Developer)',
    'مطور متكامل (Full Stack Developer)',
    'مطور تطبيقات جوال (Mobile App Developer)',
    'مهندس DevOps (DevOps Engineer)',
    'عالم بيانات (Data Scientist)',
    'محلل بيانات (Data Analyst)',
    'مهندس تعلم آلة (Machine Learning Engineer)',
    'مهندس ذكاء اصطناعي (AI Engineer)',
    'مهندس سحابة (Cloud Engineer)',
    'مسؤول قواعد بيانات (Database Administrator)',
    'مهندس شبكات (Network Engineer)',
    'أخصائي أمن سيبراني (Cybersecurity Specialist)',
    'أخصائي دعم تقني (IT Support Specialist)',
    'مسؤول أنظمة (System Administrator)',
    'مهندس ضمان جودة (QA Engineer)',
    'مصمم واجهات وتجربة مستخدم (UI/UX Designer)',
    'مدير منتج تقني (Product Manager)',
    'سكروم ماستر (Scrum Master)',
    'كاتب تقني (Technical Writer)',
    'مطور بلوكتشين (Blockchain Developer)',
    'مهندس بيانات (Data Engineer)',
    'محلل أنظمة (Systems Analyst)',
    'مهندس حلول (Solutions Architect)'
  ],

  'Business & Management': [
    'محلل أعمال (Business Analyst)',
    'مدير مشروع (Project Manager)',
    'مدير عمليات (Operations Manager)',
    'مدير عام (General Manager)',
    'مدير تطوير أعمال (Business Development Manager)',
    'مدير حسابات (Account Manager)',
    'مدير مبيعات (Sales Manager)',
    'مدير تسويق (Marketing Manager)',
    'مدير علامة تجارية (Brand Manager)',
    'مدير منتج (Product Manager)',
    'مستشار استراتيجي (Strategy Consultant)',
    'مستشار إداري (Management Consultant)',
    'محلل ذكاء أعمال (Business Intelligence Analyst)'
  ],

  'Finance & Accounting': [
    'محاسب (Accountant)',
    'محلل مالي (Financial Analyst)',
    'مدير مالي (Financial Manager)',
    'محلل استثمار (Investment Analyst)',
    'مستشار ضريبي (Tax Consultant)',
    'مدقق حسابات (Auditor)',
    'محلل ميزانية (Budget Analyst)',
    'محلل ائتمان (Credit Analyst)',
    'مدير مخاطر (Risk Manager)',
    'محلل خزينة (Treasury Analyst)',
    'أخصائي رواتب (Payroll Specialist)',
    'مسك دفاتر (Bookkeeper)',
    'مراقب مالي (Financial Controller)'
  ],

  'Sales & Marketing': [
    'مندوب مبيعات (Sales Representative)',
    'تنفيذي مبيعات (Sales Executive)',
    'تنفيذي تطوير أعمال (Business Development Executive)',
    'أخصائي تسويق (Marketing Specialist)',
    'أخصائي تسويق رقمي (Digital Marketing Specialist)',
    'مدير وسائل التواصل الاجتماعي (Social Media Manager)',
    'مدير تسويق محتوى (Content Marketing Manager)',
    'أخصائي تحسين محركات البحث (SEO Specialist)',
    'منسق تسويق (Marketing Coordinator)',
    'أخصائي علامة تجارية (Brand Specialist)',
    'تنفيذي حسابات (Account Executive)',
    'مدير نجاح العملاء (Customer Success Manager)'
  ],

  'Human Resources': [
    'مدير موارد بشرية (HR Manager)',
    'أخصائي موارد بشرية (HR Specialist)',
    'مسؤول توظيف (Recruiter)',
    'أخصائي استقطاب المواهب (Talent Acquisition Specialist)',
    'منسق موارد بشرية (HR Coordinator)',
    'مدير تدريب وتطوير (Training and Development Manager)',
    'مدير التعويضات والمزايا (Compensation and Benefits Manager)',
    'مدير علاقات الموظفين (Employee Relations Manager)',
    'شريك أعمال الموارد البشرية (HR Business Partner)'
  ],

  'Healthcare & Medical': [
    'طبيب (Doctor)',
    'ممرض (Nurse)',
    'صيدلي (Pharmacist)',
    'فني طبي (Medical Technician)',
    'طبيب أسنان (Dentist)',
    'أخصائي علاج طبيعي (Physical Therapist)',
    'أخصائي أشعة (Radiologist)',
    'موظف استقبال طبي (Medical Receptionist)',
    'مدير خدمات صحية (Healthcare Administrator)',
    'مندوب مبيعات طبية (Medical Sales Representative)'
  ],

  'Engineering': [
    'مهندس ميكانيكا (Mechanical Engineer)',
    'مهندس مدني (Civil Engineer)',
    'مهندس كهرباء (Electrical Engineer)',
    'مهندس كيمياء (Chemical Engineer)',
    'مهندس صناعي (Industrial Engineer)',
    'مهندس بترول (Petroleum Engineer)',
    'مهندس بيئي (Environmental Engineer)',
    'مهندس جودة (Quality Engineer)',
    'مهندس طيران (Aerospace Engineer)',
    'مهندس طب حيوي (Biomedical Engineer)'
  ],

  'Education & Training': [
    'معلم (Teacher)',
    'أستاذ جامعي (Professor)',
    'أخصائي تدريب (Training Specialist)',
    'مستشار تعليمي (Educational Consultant)',
    'مرشد أكاديمي (Academic Advisor)',
    'مطوّر مناهج (Curriculum Developer)',
    'مطوّر تعليم إلكتروني (E-Learning Developer)',
    'مدرب مؤسسي (Corporate Trainer)'
  ],

  'Creative & Design': [
    'مصمم جرافيك (Graphic Designer)',
    'مصمم مواقع (Web Designer)',
    'مصمم داخلي (Interior Designer)',
    'مصمم أزياء (Fashion Designer)',
    'محرر فيديو (Video Editor)',
    'مصور فوتوغرافي (Photographer)',
    'صانع محتوى (Content Creator)',
    'كاتب إعلاني (Copywriter)',
    'مدير إبداعي (Creative Director)',
    'مصمم ثلاثي الأبعاد (3D Designer)',
    'مصمم رسوم متحركة (Animation Designer)'
  ],

  'Customer Service': [
    'ممثل خدمة عملاء (Customer Service Representative)',
    'موظف مركز اتصال (Call Center Agent)',
    'أخصائي دعم عملاء (Customer Support Specialist)',
    'أخصائي دعم تقني (Technical Support Specialist)',
    'مدير علاقات العملاء (Client Relations Manager)',
    'مدير تجربة العملاء (Customer Experience Manager)'
  ],

  'Legal': [
    'محامي (Lawyer)',
    'مستشار قانوني (Legal Advisor)',
    'مساعد قانوني (Paralegal)',
    'مستشار قانوني مستقل (Legal Consultant)',
    'مدير عقود (Contract Manager)',
    'مسؤول التزام (Compliance Officer)'
  ],

  'Logistics & Supply Chain': [
    'مدير لوجستيات (Logistics Manager)',
    'مدير سلسلة إمداد (Supply Chain Manager)',
    'مدير مستودع (Warehouse Manager)',
    'أخصائي مشتريات (Procurement Specialist)',
    'مدير مخزون (Inventory Manager)',
    'منسق نقل (Transportation Coordinator)',
    'منسق عمليات (Operations Coordinator)'
  ],

  'Hospitality & Tourism': [
    'مدير فندق (Hotel Manager)',
    'مدير مطعم (Restaurant Manager)',
    'طاهٍ (Chef)',
    'مرشد سياحي (Tour Guide)',
    'منسق فعاليات (Event Coordinator)',
    'مدير مكتب استقبال (Front Desk Manager)',
    'كونسيرج (Concierge)',
    'مدير تموين (Catering Manager)'
  ],

  'Construction & Real Estate': [
    'مدير إنشاءات (Construction Manager)',
    'مهندس موقع (Site Engineer)',
    'مهندس معماري (Architect)',
    'وسيط عقاري (Real Estate Agent)',
    'مدير أملاك (Property Manager)',
    'مسّاح (Surveyor)',
    'مفتش مباني (Building Inspector)'
  ],

  'Other': [
    'مساعد إداري (Administrative Assistant)',
    'مساعد تنفيذي (Executive Assistant)',
    'مدير مكتب (Office Manager)',
    'موظف استقبال (Receptionist)',
    'مدخل بيانات (Data Entry Clerk)',
    'سكرتير (Secretary)',
    'مترجم (Translator)',
    'سائق (Driver)'
  ]
};

// Get all countries as array
export const getCountries = () => {
  return Object.keys(COUNTRIES_DATA).sort();
};

// Get cities for a country
export const getCitiesForCountry = (country) => {
  return COUNTRIES_DATA[country]?.cities || [];
};

// Get phone code for a country
export const getPhoneCodeForCountry = (country) => {
  return COUNTRIES_DATA[country]?.phoneCode || '';
};

// Get all job titles as flat array
export const getAllJobTitles = () => {
  const allTitles = [];
  Object.values(JOB_TITLES).forEach(categoryTitles => {
    allTitles.push(...categoryTitles);
  });
  return allTitles.sort();
};

// Get job titles by category
export const getJobTitlesByCategory = () => {
  return JOB_TITLES;
};