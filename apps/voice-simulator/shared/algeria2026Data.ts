// Official 2026 Algerian Administrative Divisions (69 Wilayas, 1708 Communes)
// Source: https://github.com/Kenandarabeh/algeria-wilayas-communes-2026

export interface Wilaya2026 {
  id: string;
  code: string;
  name: string;
  ar_name: string;
}

export interface Commune2026 {
  id: string;
  name: string;
  ar_name: string;
  wilaya_id: string;
}

export const WILAYAS_2026: Wilaya2026[] = [
  {
    "id": "1",
    "code": "01",
    "name": "Adrar",
    "ar_name": "أدرار"
  },
  {
    "id": "2",
    "code": "02",
    "name": "Chlef",
    "ar_name": "الشلف"
  },
  {
    "id": "3",
    "code": "03",
    "name": "Laghouat",
    "ar_name": "الأغواط"
  },
  {
    "id": "4",
    "code": "04",
    "name": "Oum El Bouaghi",
    "ar_name": "أم البواقي"
  },
  {
    "id": "5",
    "code": "05",
    "name": "Batna",
    "ar_name": "باتنة"
  },
  {
    "id": "6",
    "code": "06",
    "name": "Béjaïa",
    "ar_name": "بجاية"
  },
  {
    "id": "7",
    "code": "07",
    "name": "Biskra",
    "ar_name": "بسكرة"
  },
  {
    "id": "8",
    "code": "08",
    "name": "Bechar",
    "ar_name": "بشار"
  },
  {
    "id": "9",
    "code": "09",
    "name": "Blida",
    "ar_name": "البليدة"
  },
  {
    "id": "10",
    "code": "10",
    "name": "Bouira",
    "ar_name": "البويرة"
  },
  {
    "id": "11",
    "code": "11",
    "name": "Tamanrasset",
    "ar_name": "تمنراست"
  },
  {
    "id": "12",
    "code": "12",
    "name": "Tbessa",
    "ar_name": "تبسة"
  },
  {
    "id": "13",
    "code": "13",
    "name": "Tlemcen",
    "ar_name": "تلمسان"
  },
  {
    "id": "14",
    "code": "14",
    "name": "Tiaret",
    "ar_name": "تيارت"
  },
  {
    "id": "15",
    "code": "15",
    "name": "Tizi Ouzou",
    "ar_name": "تيزي وزو"
  },
  {
    "id": "16",
    "code": "16",
    "name": "Alger",
    "ar_name": "الجزائر"
  },
  {
    "id": "17",
    "code": "17",
    "name": "Djelfa",
    "ar_name": "الجلفة"
  },
  {
    "id": "18",
    "code": "18",
    "name": "Jijel",
    "ar_name": "جيجل"
  },
  {
    "id": "19",
    "code": "19",
    "name": "Setif",
    "ar_name": "سطيف"
  },
  {
    "id": "20",
    "code": "20",
    "name": "Saida",
    "ar_name": "سعيدة"
  },
  {
    "id": "21",
    "code": "21",
    "name": "Skikda",
    "ar_name": "سكيكدة"
  },
  {
    "id": "22",
    "code": "22",
    "name": "Sidi Bel Abbes",
    "ar_name": "سيدي بلعباس"
  },
  {
    "id": "23",
    "code": "23",
    "name": "Annaba",
    "ar_name": "عنابة"
  },
  {
    "id": "24",
    "code": "24",
    "name": "Guelma",
    "ar_name": "قالمة"
  },
  {
    "id": "25",
    "code": "25",
    "name": "Constantine",
    "ar_name": "قسنطينة"
  },
  {
    "id": "26",
    "code": "26",
    "name": "Medea",
    "ar_name": "المدية"
  },
  {
    "id": "27",
    "code": "27",
    "name": "Mostaganem",
    "ar_name": "مستغانم"
  },
  {
    "id": "28",
    "code": "28",
    "name": "M'Sila",
    "ar_name": "المسيلة"
  },
  {
    "id": "29",
    "code": "29",
    "name": "Mascara",
    "ar_name": "معسكر"
  },
  {
    "id": "30",
    "code": "30",
    "name": "Ouargla",
    "ar_name": "ورقلة"
  },
  {
    "id": "31",
    "code": "31",
    "name": "Oran",
    "ar_name": "وهران"
  },
  {
    "id": "32",
    "code": "32",
    "name": "El Bayadh",
    "ar_name": "البيض"
  },
  {
    "id": "33",
    "code": "33",
    "name": "Illizi",
    "ar_name": "إليزي"
  },
  {
    "id": "34",
    "code": "34",
    "name": "Bordj Bou Arreridj",
    "ar_name": "برج بوعريريج"
  },
  {
    "id": "35",
    "code": "35",
    "name": "Boumerdes",
    "ar_name": "بومرداس"
  },
  {
    "id": "36",
    "code": "36",
    "name": "El Tarf",
    "ar_name": "الطارف"
  },
  {
    "id": "37",
    "code": "37",
    "name": "Tindouf",
    "ar_name": "تندوف"
  },
  {
    "id": "38",
    "code": "38",
    "name": "Tissemsilt",
    "ar_name": "تيسمسيلت"
  },
  {
    "id": "39",
    "code": "39",
    "name": "El Oued",
    "ar_name": "الوادي"
  },
  {
    "id": "40",
    "code": "40",
    "name": "Khenchela",
    "ar_name": "خنشلة"
  },
  {
    "id": "41",
    "code": "41",
    "name": "Souk Ahras",
    "ar_name": "سوق أهراس"
  },
  {
    "id": "42",
    "code": "42",
    "name": "Tipaza",
    "ar_name": "تيبازة"
  },
  {
    "id": "43",
    "code": "43",
    "name": "Mila",
    "ar_name": "ميلة"
  },
  {
    "id": "44",
    "code": "44",
    "name": "Ain Defla",
    "ar_name": "عين الدفلى"
  },
  {
    "id": "45",
    "code": "45",
    "name": "Naama",
    "ar_name": "النعامة"
  },
  {
    "id": "46",
    "code": "46",
    "name": "Ain Temouchent",
    "ar_name": "عين تموشنت"
  },
  {
    "id": "47",
    "code": "47",
    "name": "Ghardaia",
    "ar_name": "غرداية"
  },
  {
    "id": "48",
    "code": "48",
    "name": "Relizane",
    "ar_name": "غليزان"
  },
  {
    "id": "49",
    "code": "49",
    "name": "El M'ghair",
    "ar_name": "المغير"
  },
  {
    "id": "50",
    "code": "50",
    "name": "El Menia",
    "ar_name": "المنيعة"
  },
  {
    "id": "51",
    "code": "51",
    "name": "Ouled Djellal",
    "ar_name": "أولاد جلال"
  },
  {
    "id": "52",
    "code": "52",
    "name": "Bordj Baji Mokhtar",
    "ar_name": "برج باجي مختار"
  },
  {
    "id": "53",
    "code": "53",
    "name": "Béni Abbès",
    "ar_name": "بني عباس"
  },
  {
    "id": "54",
    "code": "54",
    "name": "Timimoun",
    "ar_name": "تيميمون"
  },
  {
    "id": "55",
    "code": "55",
    "name": "Touggourt",
    "ar_name": "تقرت"
  },
  {
    "id": "56",
    "code": "56",
    "name": "Djanet",
    "ar_name": "جانت"
  },
  {
    "id": "57",
    "code": "57",
    "name": "In Salah",
    "ar_name": "عين صالح"
  },
  {
    "id": "58",
    "code": "58",
    "name": "In Guezzam",
    "ar_name": "عين قزام"
  },
  {
    "id": "59",
    "code": "59",
    "name": "Aflou",
    "ar_name": "آفلو"
  },
  {
    "id": "60",
    "code": "60",
    "name": "Barika",
    "ar_name": "بريكة"
  },
  {
    "id": "61",
    "code": "61",
    "name": "El Kantara",
    "ar_name": "القنطرة"
  },
  {
    "id": "62",
    "code": "62",
    "name": "Bir El Ater",
    "ar_name": "بئر العاتر"
  },
  {
    "id": "63",
    "code": "63",
    "name": "El Aricha",
    "ar_name": "العريشة"
  },
  {
    "id": "64",
    "code": "64",
    "name": "Ksar Chellala",
    "ar_name": "قصر الشلالة"
  },
  {
    "id": "65",
    "code": "65",
    "name": "Ain Oussera",
    "ar_name": "عين وسارة"
  },
  {
    "id": "66",
    "code": "66",
    "name": "Messad",
    "ar_name": "مسعد"
  },
  {
    "id": "67",
    "code": "67",
    "name": "Ksar El Boukhari",
    "ar_name": "قصر البخاري"
  },
  {
    "id": "68",
    "code": "68",
    "name": "Bou Saada",
    "ar_name": "بوسعادة"
  },
  {
    "id": "69",
    "code": "69",
    "name": "El Abiodh Sidi Cheikh",
    "ar_name": "الأبيض سيدي الشيخ"
  }
];

export const COMMUNES_2026: Commune2026[] = [
  {
    "id": "1",
    "name": "Adrar",
    "ar_name": "أدرار",
    "wilaya_id": "1"
  },
  {
    "id": "2",
    "name": "Tamest",
    "ar_name": "تأماست",
    "wilaya_id": "1"
  },
  {
    "id": "3",
    "name": "Charouine",
    "ar_name": "شروين",
    "wilaya_id": "49"
  },
  {
    "id": "4",
    "name": "Reggane",
    "ar_name": "رڨان",
    "wilaya_id": "1"
  },
  {
    "id": "5",
    "name": "In Zghmir",
    "ar_name": "ان زغمير",
    "wilaya_id": "1"
  },
  {
    "id": "6",
    "name": "Tit",
    "ar_name": "تــيـــت",
    "wilaya_id": "1"
  },
  {
    "id": "7",
    "name": "Ksar Kaddour",
    "ar_name": "قصر قدور",
    "wilaya_id": "49"
  },
  {
    "id": "8",
    "name": "Tsabit",
    "ar_name": "تسابيت",
    "wilaya_id": "1"
  },
  {
    "id": "9",
    "name": "Timimoun",
    "ar_name": "تيميمون",
    "wilaya_id": "49"
  },
  {
    "id": "10",
    "name": "Ouled Said",
    "ar_name": "أولاد سعيد",
    "wilaya_id": "49"
  },
  {
    "id": "11",
    "name": "Zaouiet Kounta",
    "ar_name": "زاوية كنتة",
    "wilaya_id": "1"
  },
  {
    "id": "12",
    "name": "Aoulef",
    "ar_name": "أولف",
    "wilaya_id": "1"
  },
  {
    "id": "13",
    "name": "Timokten",
    "ar_name": "تيمقتن",
    "wilaya_id": "1"
  },
  {
    "id": "14",
    "name": "Tamentit",
    "ar_name": "تامنطيت",
    "wilaya_id": "1"
  },
  {
    "id": "15",
    "name": "Fenoughil",
    "ar_name": "فنوغيل",
    "wilaya_id": "1"
  },
  {
    "id": "16",
    "name": "Tinerkouk",
    "ar_name": "زاوية دباغ",
    "wilaya_id": "49"
  },
  {
    "id": "17",
    "name": "Deldoul",
    "ar_name": "دﻟﺪول",
    "wilaya_id": "49"
  },
  {
    "id": "18",
    "name": "Sali",
    "ar_name": "سالى",
    "wilaya_id": "1"
  },
  {
    "id": "19",
    "name": "Akabli",
    "ar_name": "أقبلي",
    "wilaya_id": "1"
  },
  {
    "id": "20",
    "name": "Metarfa",
    "ar_name": "المطارفة",
    "wilaya_id": "49"
  },
  {
    "id": "21",
    "name": "Ouled Ahmed Tammi",
    "ar_name": "أولاد أحمد تيمى",
    "wilaya_id": "1"
  },
  {
    "id": "22",
    "name": "Bouda",
    "ar_name": "بودة",
    "wilaya_id": "1"
  },
  {
    "id": "23",
    "name": "Aougrout",
    "ar_name": "أوقروت",
    "wilaya_id": "49"
  },
  {
    "id": "24",
    "name": "Talmine",
    "ar_name": "",
    "wilaya_id": "49"
  },
  {
    "id": "25",
    "name": "Bordj Badji Mokhtar",
    "ar_name": "برج باجي مختار",
    "wilaya_id": "50"
  },
  {
    "id": "26",
    "name": "Sbaa",
    "ar_name": "السبع",
    "wilaya_id": "1"
  },
  {
    "id": "27",
    "name": "Ouled Aissa",
    "ar_name": "أولاد عيسى",
    "wilaya_id": "49"
  },
  {
    "id": "28",
    "name": "Timiaouine",
    "ar_name": "تيمياوين",
    "wilaya_id": "50"
  },
  {
    "id": "29",
    "name": "Chlef",
    "ar_name": "الشلف",
    "wilaya_id": "2"
  },
  {
    "id": "30",
    "name": "Tenes",
    "ar_name": "تنس",
    "wilaya_id": "2"
  },
  {
    "id": "31",
    "name": "Benairia",
    "ar_name": "بنايرية",
    "wilaya_id": "2"
  },
  {
    "id": "32",
    "name": "El Karimia",
    "ar_name": "الكريمية",
    "wilaya_id": "2"
  },
  {
    "id": "33",
    "name": "Tadjna",
    "ar_name": "تاجنة",
    "wilaya_id": "2"
  },
  {
    "id": "34",
    "name": "Taougrite",
    "ar_name": "تاوقريت",
    "wilaya_id": "2"
  },
  {
    "id": "35",
    "name": "Beni Haoua",
    "ar_name": "بني حواء",
    "wilaya_id": "2"
  },
  {
    "id": "36",
    "name": "Sobha",
    "ar_name": "صبحة",
    "wilaya_id": "2"
  },
  {
    "id": "37",
    "name": "Harchoun",
    "ar_name": "حرشون",
    "wilaya_id": "2"
  },
  {
    "id": "38",
    "name": "Ouled Fares",
    "ar_name": "أولاد فارس",
    "wilaya_id": "2"
  },
  {
    "id": "39",
    "name": "Sidi Akacha",
    "ar_name": "سيدي عكاشة",
    "wilaya_id": "2"
  },
  {
    "id": "40",
    "name": "Boukadir",
    "ar_name": "بوقدير",
    "wilaya_id": "2"
  },
  {
    "id": "41",
    "name": "Beni Rached",
    "ar_name": "بني راشد",
    "wilaya_id": "2"
  },
  {
    "id": "42",
    "name": "Talassa",
    "ar_name": "تلعصة",
    "wilaya_id": "2"
  },
  {
    "id": "43",
    "name": "Herenfa",
    "ar_name": "الهرنفة",
    "wilaya_id": "2"
  },
  {
    "id": "44",
    "name": "Oued Goussine",
    "ar_name": "واد ڨوسين",
    "wilaya_id": "2"
  },
  {
    "id": "45",
    "name": "Dahra",
    "ar_name": "الظهرة",
    "wilaya_id": "2"
  },
  {
    "id": "46",
    "name": "Ouled Abbes",
    "ar_name": "أولاد عباس",
    "wilaya_id": "2"
  },
  {
    "id": "47",
    "name": "Sendjas",
    "ar_name": "سنجاس",
    "wilaya_id": "2"
  },
  {
    "id": "48",
    "name": "Zeboudja",
    "ar_name": "الزبوجة",
    "wilaya_id": "2"
  },
  {
    "id": "49",
    "name": "Oued Sly",
    "ar_name": "واد سلي",
    "wilaya_id": "2"
  },
  {
    "id": "50",
    "name": "Abou El Hassen",
    "ar_name": "أبو الحسن",
    "wilaya_id": "2"
  },
  {
    "id": "51",
    "name": "El Marsa",
    "ar_name": "المرصى",
    "wilaya_id": "2"
  },
  {
    "id": "52",
    "name": "Chettia",
    "ar_name": "الشطية",
    "wilaya_id": "2"
  },
  {
    "id": "53",
    "name": "Sidi Abderrahmane",
    "ar_name": "سيدي عبد الرحمان",
    "wilaya_id": "2"
  },
  {
    "id": "54",
    "name": "Moussadek",
    "ar_name": "مصدق",
    "wilaya_id": "2"
  },
  {
    "id": "55",
    "name": "El Hadjadj",
    "ar_name": "الحجاج",
    "wilaya_id": "2"
  },
  {
    "id": "56",
    "name": "Labiod Medjadja",
    "ar_name": "الأبيض مجاجة",
    "wilaya_id": "2"
  },
  {
    "id": "57",
    "name": "Oued Fodda",
    "ar_name": "واد الفضة",
    "wilaya_id": "2"
  },
  {
    "id": "58",
    "name": "Ouled Ben Abdelkader",
    "ar_name": "أولاد بن عبد القادر",
    "wilaya_id": "2"
  },
  {
    "id": "59",
    "name": "Bouzghaia",
    "ar_name": "بوزغاية",
    "wilaya_id": "2"
  },
  {
    "id": "60",
    "name": "Ain Merane",
    "ar_name": "عين مران",
    "wilaya_id": "2"
  },
  {
    "id": "61",
    "name": "Oum Drou",
    "ar_name": "أم الذروع",
    "wilaya_id": "2"
  },
  {
    "id": "62",
    "name": "Breira",
    "ar_name": "بريرة",
    "wilaya_id": "2"
  },
  {
    "id": "63",
    "name": "Beni Bouateb",
    "ar_name": "بني بوعتاب",
    "wilaya_id": "2"
  },
  {
    "id": "64",
    "name": "Laghouat",
    "ar_name": "الأغواط",
    "wilaya_id": "3"
  },
  {
    "id": "65",
    "name": "Ksar El Hirane",
    "ar_name": "قصر الحيران",
    "wilaya_id": "3"
  },
  {
    "id": "66",
    "name": "Benacer Ben Chohra",
    "ar_name": "بن ناصر بن شهرة",
    "wilaya_id": "3"
  },
  {
    "id": "67",
    "name": "Sidi Makhlouf",
    "ar_name": "سيدي مخلوف",
    "wilaya_id": "3"
  },
  {
    "id": "68",
    "name": "Hassi Delaa",
    "ar_name": "حاسي دلاعة",
    "wilaya_id": "3"
  },
  {
    "id": "69",
    "name": "Hassi R'Mel",
    "ar_name": "حاسي الرمل",
    "wilaya_id": "3"
  },
  {
    "id": "70",
    "name": "Ain Mahdi",
    "ar_name": "عــيــن مـــاضــي",
    "wilaya_id": "3"
  },
  {
    "id": "71",
    "name": "Tadjmout",
    "ar_name": "تاجموت",
    "wilaya_id": "3"
  },
  {
    "id": "72",
    "name": "El Kheneg",
    "ar_name": "الخنق",
    "wilaya_id": "3"
  },
  {
    "id": "73",
    "name": "Gueltat Sidi Saad",
    "ar_name": "قلتة سيدي سعد",
    "wilaya_id": "59"
  },
  {
    "id": "74",
    "name": "Ain Sidi Ali",
    "ar_name": "عين سيدي علي",
    "wilaya_id": "59"
  },
  {
    "id": "75",
    "name": "Beidha",
    "ar_name": "بيضاء",
    "wilaya_id": "59"
  },
  {
    "id": "76",
    "name": "Brida",
    "ar_name": "بريدة",
    "wilaya_id": "59"
  },
  {
    "id": "77",
    "name": "El Ghicha",
    "ar_name": "الغيشة",
    "wilaya_id": "59"
  },
  {
    "id": "78",
    "name": "Hadj Mechri",
    "ar_name": "الحاج المشري",
    "wilaya_id": "3"
  },
  {
    "id": "79",
    "name": "Sebgag",
    "ar_name": "سبقاق",
    "wilaya_id": "59"
  },
  {
    "id": "80",
    "name": "Taouiala",
    "ar_name": "تاويالة",
    "wilaya_id": "3"
  },
  {
    "id": "81",
    "name": "Tadjrouna",
    "ar_name": "تاجرونة",
    "wilaya_id": "3"
  },
  {
    "id": "82",
    "name": "Aflou",
    "ar_name": "أفلو",
    "wilaya_id": "59"
  },
  {
    "id": "83",
    "name": "El Assafia",
    "ar_name": "العسافية",
    "wilaya_id": "3"
  },
  {
    "id": "84",
    "name": "Oued Morra",
    "ar_name": "وادي مرة",
    "wilaya_id": "59"
  },
  {
    "id": "85",
    "name": "Oued M'Zi",
    "ar_name": "وادي مزي",
    "wilaya_id": "3"
  },
  {
    "id": "86",
    "name": "El Haouaita",
    "ar_name": "الهوارية",
    "wilaya_id": "3"
  },
  {
    "id": "87",
    "name": "Sidi Bouzid",
    "ar_name": "سيدي بوزيد",
    "wilaya_id": "59"
  },
  {
    "id": "88",
    "name": "Oum El Bouaghi",
    "ar_name": "أم البواقي",
    "wilaya_id": "4"
  },
  {
    "id": "89",
    "name": "Ain Beida",
    "ar_name": "عين البيضاء",
    "wilaya_id": "4"
  },
  {
    "id": "90",
    "name": "Ain M'lila",
    "ar_name": "عين مليلة",
    "wilaya_id": "4"
  },
  {
    "id": "91",
    "name": "Behir Chergui",
    "ar_name": "بحير الشرڨي",
    "wilaya_id": "4"
  },
  {
    "id": "92",
    "name": "El Amiria",
    "ar_name": "العامرية",
    "wilaya_id": "4"
  },
  {
    "id": "93",
    "name": "Sigus",
    "ar_name": "سيقوس",
    "wilaya_id": "4"
  },
  {
    "id": "94",
    "name": "El Belala",
    "ar_name": "البلالة",
    "wilaya_id": "4"
  },
  {
    "id": "95",
    "name": "Ain Babouche",
    "ar_name": "عين بابوش",
    "wilaya_id": "4"
  },
  {
    "id": "96",
    "name": "Berriche",
    "ar_name": "بريش",
    "wilaya_id": "4"
  },
  {
    "id": "97",
    "name": "Ouled Hamla",
    "ar_name": "أولاد حملة",
    "wilaya_id": "4"
  },
  {
    "id": "98",
    "name": "Dhala",
    "ar_name": "الضلعة",
    "wilaya_id": "4"
  },
  {
    "id": "99",
    "name": "Ain Kercha",
    "ar_name": "عين كرشة",
    "wilaya_id": "4"
  },
  {
    "id": "100",
    "name": "Hanchir Toumghani",
    "ar_name": "هنشير تومغني",
    "wilaya_id": "4"
  },
  {
    "id": "101",
    "name": "El Djazia",
    "ar_name": "الجازيـــــــة",
    "wilaya_id": "4"
  },
  {
    "id": "102",
    "name": "Ain Diss",
    "ar_name": "عين الديس",
    "wilaya_id": "4"
  },
  {
    "id": "103",
    "name": "Fkirina",
    "ar_name": "فكرينة",
    "wilaya_id": "4"
  },
  {
    "id": "104",
    "name": "Souk Naamane",
    "ar_name": "سوق نعمان",
    "wilaya_id": "4"
  },
  {
    "id": "105",
    "name": "Zorg",
    "ar_name": "الزرڨ",
    "wilaya_id": "4"
  },
  {
    "id": "106",
    "name": "El Fedjoudj Boughrara Saoudi",
    "ar_name": "الفجوج بوغرارة سعودى",
    "wilaya_id": "4"
  },
  {
    "id": "107",
    "name": "Ouled Zouai",
    "ar_name": "أولاد زواي",
    "wilaya_id": "4"
  },
  {
    "id": "108",
    "name": "Bir Chouhada",
    "ar_name": "بئر الشهداء",
    "wilaya_id": "4"
  },
  {
    "id": "109",
    "name": "Ksar Sbahi",
    "ar_name": "قصر صباحي",
    "wilaya_id": "4"
  },
  {
    "id": "110",
    "name": "Oued Nini",
    "ar_name": "وادي نيني",
    "wilaya_id": "4"
  },
  {
    "id": "111",
    "name": "Meskiana",
    "ar_name": "مسكيانة",
    "wilaya_id": "4"
  },
  {
    "id": "112",
    "name": "Ain Fekroune",
    "ar_name": "عين فكرون",
    "wilaya_id": "4"
  },
  {
    "id": "113",
    "name": "Rahia",
    "ar_name": "الراحية",
    "wilaya_id": "4"
  },
  {
    "id": "114",
    "name": "Ain Zitoun",
    "ar_name": "عين الزيتون",
    "wilaya_id": "4"
  },
  {
    "id": "115",
    "name": "Ouled Gacem",
    "ar_name": "أولاد ڨاسم",
    "wilaya_id": "4"
  },
  {
    "id": "116",
    "name": "El Harmilia",
    "ar_name": "الحرملية",
    "wilaya_id": "4"
  },
  {
    "id": "117",
    "name": "Batna",
    "ar_name": "باتنة",
    "wilaya_id": "5"
  },
  {
    "id": "118",
    "name": "Ghassira",
    "ar_name": "غسيرة",
    "wilaya_id": "5"
  },
  {
    "id": "119",
    "name": "Maafa",
    "ar_name": "معافة",
    "wilaya_id": "5"
  },
  {
    "id": "120",
    "name": "Merouana",
    "ar_name": "مروانة",
    "wilaya_id": "5"
  },
  {
    "id": "121",
    "name": "Seriana",
    "ar_name": "سريانة",
    "wilaya_id": "5"
  },
  {
    "id": "122",
    "name": "Menaa",
    "ar_name": "منعة",
    "wilaya_id": "5"
  },
  {
    "id": "123",
    "name": "El Madher",
    "ar_name": "المعذر",
    "wilaya_id": "60"
  },
  {
    "id": "124",
    "name": "Tazoult",
    "ar_name": "تازولت",
    "wilaya_id": "5"
  },
  {
    "id": "125",
    "name": "Ngaous",
    "ar_name": "نڨاوس",
    "wilaya_id": "5"
  },
  {
    "id": "126",
    "name": "Guigba",
    "ar_name": "قيقبة",
    "wilaya_id": "5"
  },
  {
    "id": "127",
    "name": "Inoughissen",
    "ar_name": "إينوغيسن",
    "wilaya_id": "5"
  },
  {
    "id": "128",
    "name": "Ouyoun El Assafir",
    "ar_name": "عيون العصافير",
    "wilaya_id": "5"
  },
  {
    "id": "129",
    "name": "Djerma",
    "ar_name": "جرمة",
    "wilaya_id": "60"
  },
  {
    "id": "130",
    "name": "Bitam",
    "ar_name": "بيطام",
    "wilaya_id": "60"
  },
  {
    "id": "131",
    "name": "Metkaouak",
    "ar_name": "عزيل عبد القادر",
    "wilaya_id": "5"
  },
  {
    "id": "132",
    "name": "Arris",
    "ar_name": "اريس",
    "wilaya_id": "5"
  },
  {
    "id": "133",
    "name": "Kimmel",
    "ar_name": "كيمل",
    "wilaya_id": "5"
  },
  {
    "id": "134",
    "name": "Tilatou",
    "ar_name": "تيلاطو",
    "wilaya_id": "5"
  },
  {
    "id": "135",
    "name": "Ain Djasser",
    "ar_name": "عين جاسر",
    "wilaya_id": "5"
  },
  {
    "id": "136",
    "name": "Ouled Selam",
    "ar_name": "أولاد سلام",
    "wilaya_id": "5"
  },
  {
    "id": "137",
    "name": "Tigherghar",
    "ar_name": "تيغرغار",
    "wilaya_id": "5"
  },
  {
    "id": "138",
    "name": "Ain Yagout",
    "ar_name": "عين ياقوت",
    "wilaya_id": "5"
  },
  {
    "id": "139",
    "name": "Fesdis",
    "ar_name": "فسديس",
    "wilaya_id": "5"
  },
  {
    "id": "140",
    "name": "Sefiane",
    "ar_name": "سفيان",
    "wilaya_id": "5"
  },
  {
    "id": "141",
    "name": "Rahbat",
    "ar_name": "الرحبات",
    "wilaya_id": "5"
  },
  {
    "id": "142",
    "name": "Tighanimine",
    "ar_name": "تيغانمين",
    "wilaya_id": "5"
  },
  {
    "id": "143",
    "name": "Lemsane",
    "ar_name": "لمسان",
    "wilaya_id": "5"
  },
  {
    "id": "144",
    "name": "Ksar Belezma",
    "ar_name": "قصر بلازمة",
    "wilaya_id": "5"
  },
  {
    "id": "145",
    "name": "Seggana",
    "ar_name": "سقانة",
    "wilaya_id": "60"
  },
  {
    "id": "146",
    "name": "Ichmoul",
    "ar_name": "ايشمول",
    "wilaya_id": "5"
  },
  {
    "id": "147",
    "name": "Foum Toub",
    "ar_name": "فم الطوب",
    "wilaya_id": "5"
  },
  {
    "id": "148",
    "name": "Beni Foudhala El Hakania",
    "ar_name": "بنى فضالة الحقانية",
    "wilaya_id": "5"
  },
  {
    "id": "149",
    "name": "Oued El Ma",
    "ar_name": "واد الماء",
    "wilaya_id": "5"
  },
  {
    "id": "150",
    "name": "Talkhamt",
    "ar_name": "تالخمت",
    "wilaya_id": "5"
  },
  {
    "id": "151",
    "name": "Bouzina",
    "ar_name": "بوزينة",
    "wilaya_id": "5"
  },
  {
    "id": "152",
    "name": "Chemora",
    "ar_name": "الشمرة",
    "wilaya_id": "5"
  },
  {
    "id": "153",
    "name": "Oued Chaaba",
    "ar_name": "واد الشعبة",
    "wilaya_id": "5"
  },
  {
    "id": "154",
    "name": "Taxlent",
    "ar_name": "تاكسلانت",
    "wilaya_id": "5"
  },
  {
    "id": "155",
    "name": "Gosbat",
    "ar_name": "القصبات",
    "wilaya_id": "5"
  },
  {
    "id": "156",
    "name": "Ouled Aouf",
    "ar_name": "أولاد عوف",
    "wilaya_id": "5"
  },
  {
    "id": "157",
    "name": "Boumagueur",
    "ar_name": "بــومقر",
    "wilaya_id": "5"
  },
  {
    "id": "158",
    "name": "Barika",
    "ar_name": "بريكة",
    "wilaya_id": "60"
  },
  {
    "id": "159",
    "name": "Djezzar",
    "ar_name": "الجزار",
    "wilaya_id": "5"
  },
  {
    "id": "160",
    "name": "Tkout",
    "ar_name": "تكوت",
    "wilaya_id": "5"
  },
  {
    "id": "161",
    "name": "Ain Touta",
    "ar_name": "عين التوتة",
    "wilaya_id": "5"
  },
  {
    "id": "162",
    "name": "Hidoussa",
    "ar_name": "حيدوسة",
    "wilaya_id": "5"
  },
  {
    "id": "163",
    "name": "Teniet El Abed",
    "ar_name": "نية العابد",
    "wilaya_id": "5"
  },
  {
    "id": "164",
    "name": "Oued Taga",
    "ar_name": "وادي الطاقة",
    "wilaya_id": "5"
  },
  {
    "id": "165",
    "name": "Ouled Fadel",
    "ar_name": "أولاد فاضل",
    "wilaya_id": "5"
  },
  {
    "id": "166",
    "name": "Timgad",
    "ar_name": "تيمقاد",
    "wilaya_id": "5"
  },
  {
    "id": "167",
    "name": "Ras El Aioun",
    "ar_name": "رأس العيون",
    "wilaya_id": "5"
  },
  {
    "id": "168",
    "name": "Chir",
    "ar_name": "شير",
    "wilaya_id": "5"
  },
  {
    "id": "169",
    "name": "Ouled Si Slimane",
    "ar_name": "أولاد سي سليمان",
    "wilaya_id": "5"
  },
  {
    "id": "170",
    "name": "Zanat El Beida",
    "ar_name": "زانة البيضاء",
    "wilaya_id": "5"
  },
  {
    "id": "171",
    "name": "M'doukel",
    "ar_name": "أمدوكال",
    "wilaya_id": "5"
  },
  {
    "id": "172",
    "name": "Ouled Ammar",
    "ar_name": "أولاد عمار",
    "wilaya_id": "60"
  },
  {
    "id": "173",
    "name": "El Hassi",
    "ar_name": "الحاسي",
    "wilaya_id": "5"
  },
  {
    "id": "174",
    "name": "Lazrou",
    "ar_name": "لازرو",
    "wilaya_id": "5"
  },
  {
    "id": "175",
    "name": "Boumia",
    "ar_name": "بومية",
    "wilaya_id": "5"
  },
  {
    "id": "176",
    "name": "Boulhilat",
    "ar_name": "بولهيلات",
    "wilaya_id": "5"
  },
  {
    "id": "177",
    "name": "Larbaa",
    "ar_name": "الاربعاء",
    "wilaya_id": "5"
  },
  {
    "id": "178",
    "name": "Bejaia",
    "ar_name": "بجاية",
    "wilaya_id": "6"
  },
  {
    "id": "179",
    "name": "Amizour",
    "ar_name": "اميزور",
    "wilaya_id": "6"
  },
  {
    "id": "180",
    "name": "Ferraoun",
    "ar_name": "فرعون",
    "wilaya_id": "6"
  },
  {
    "id": "181",
    "name": "Taourirt Ighil",
    "ar_name": "تاوريرت اغيل",
    "wilaya_id": "6"
  },
  {
    "id": "182",
    "name": "Chelata",
    "ar_name": "شلاطة",
    "wilaya_id": "6"
  },
  {
    "id": "183",
    "name": "Tamokra",
    "ar_name": "تامقرة",
    "wilaya_id": "6"
  },
  {
    "id": "184",
    "name": "Timzrit",
    "ar_name": "تيمزريت",
    "wilaya_id": "6"
  },
  {
    "id": "185",
    "name": "Souk El Thenine",
    "ar_name": "ﺳﻮق اﻻﺛﻨﻴﻦ",
    "wilaya_id": "6"
  },
  {
    "id": "186",
    "name": "M'cisna",
    "ar_name": "مسيسنة",
    "wilaya_id": "6"
  },
  {
    "id": "187",
    "name": "Thinabdher",
    "ar_name": "تينبذار",
    "wilaya_id": "6"
  },
  {
    "id": "188",
    "name": "Tichi",
    "ar_name": "تيشي",
    "wilaya_id": "6"
  },
  {
    "id": "189",
    "name": "Semaoun",
    "ar_name": "سمعون",
    "wilaya_id": "6"
  },
  {
    "id": "190",
    "name": "Kendira",
    "ar_name": "كنديرة",
    "wilaya_id": "6"
  },
  {
    "id": "191",
    "name": "Tifra",
    "ar_name": "تيفرة",
    "wilaya_id": "6"
  },
  {
    "id": "192",
    "name": "Ighram",
    "ar_name": "إغرم",
    "wilaya_id": "6"
  },
  {
    "id": "193",
    "name": "Amalou",
    "ar_name": "امالو",
    "wilaya_id": "6"
  },
  {
    "id": "194",
    "name": "Ighil Ali",
    "ar_name": "إغيل على",
    "wilaya_id": "6"
  },
  {
    "id": "195",
    "name": "Ifelain Ilmathen",
    "ar_name": "افناين الماثن",
    "wilaya_id": "6"
  },
  {
    "id": "196",
    "name": "Toudja",
    "ar_name": "توجة",
    "wilaya_id": "6"
  },
  {
    "id": "197",
    "name": "Darguina",
    "ar_name": "درقينة",
    "wilaya_id": "6"
  },
  {
    "id": "198",
    "name": "Sidi Ayad",
    "ar_name": "سيدي عياد",
    "wilaya_id": "6"
  },
  {
    "id": "199",
    "name": "Aokas",
    "ar_name": "أوقاس",
    "wilaya_id": "6"
  },
  {
    "id": "200",
    "name": "Ait Djellil",
    "ar_name": "آيث جليل",
    "wilaya_id": "6"
  },
  {
    "id": "201",
    "name": "Adekar",
    "ar_name": "آدكار",
    "wilaya_id": "6"
  },
  {
    "id": "202",
    "name": "Akbou",
    "ar_name": "أقبو",
    "wilaya_id": "6"
  },
  {
    "id": "203",
    "name": "Seddouk",
    "ar_name": "صدوق",
    "wilaya_id": "6"
  },
  {
    "id": "204",
    "name": "Tazmalt",
    "ar_name": "تازمالت",
    "wilaya_id": "6"
  },
  {
    "id": "205",
    "name": "Ait R'zine",
    "ar_name": "آيت أرزين",
    "wilaya_id": "6"
  },
  {
    "id": "206",
    "name": "Chemini",
    "ar_name": "شميني",
    "wilaya_id": "6"
  },
  {
    "id": "207",
    "name": "Souk Oufella",
    "ar_name": "سوق أوفلة",
    "wilaya_id": "6"
  },
  {
    "id": "208",
    "name": "Taskriout",
    "ar_name": "تاسقريوت",
    "wilaya_id": "6"
  },
  {
    "id": "209",
    "name": "Tibane",
    "ar_name": "طيبان",
    "wilaya_id": "6"
  },
  {
    "id": "210",
    "name": "Tala Hamza",
    "ar_name": "ثالة حمزة",
    "wilaya_id": "6"
  },
  {
    "id": "211",
    "name": "Barbacha",
    "ar_name": "برباشة",
    "wilaya_id": "6"
  },
  {
    "id": "212",
    "name": "Beni Ksila",
    "ar_name": "بنى كسيلة",
    "wilaya_id": "6"
  },
  {
    "id": "213",
    "name": "Ouzallaguen",
    "ar_name": "أوزلاقن",
    "wilaya_id": "6"
  },
  {
    "id": "214",
    "name": "Bouhamza",
    "ar_name": "بوحمزة",
    "wilaya_id": "6"
  },
  {
    "id": "215",
    "name": "Beni Melikeche",
    "ar_name": "بنى مليكش",
    "wilaya_id": "6"
  },
  {
    "id": "216",
    "name": "Sidi Aich",
    "ar_name": "سيدي عيش",
    "wilaya_id": "6"
  },
  {
    "id": "217",
    "name": "El Kseur",
    "ar_name": "القصر",
    "wilaya_id": "6"
  },
  {
    "id": "218",
    "name": "Melbou",
    "ar_name": "ملبو",
    "wilaya_id": "6"
  },
  {
    "id": "219",
    "name": "Akfadou",
    "ar_name": "اكفادو",
    "wilaya_id": "6"
  },
  {
    "id": "220",
    "name": "Leflaye",
    "ar_name": "لفلاى",
    "wilaya_id": "6"
  },
  {
    "id": "221",
    "name": "Kherrata",
    "ar_name": "خراطة",
    "wilaya_id": "6"
  },
  {
    "id": "222",
    "name": "Draa Kaid",
    "ar_name": "ذراع القايد",
    "wilaya_id": "6"
  },
  {
    "id": "223",
    "name": "Tamridjet",
    "ar_name": "تامريجت",
    "wilaya_id": "6"
  },
  {
    "id": "224",
    "name": "Ait Smail",
    "ar_name": "آيت سماعيل",
    "wilaya_id": "6"
  },
  {
    "id": "225",
    "name": "Boukhelifa",
    "ar_name": "بوخليفة",
    "wilaya_id": "6"
  },
  {
    "id": "226",
    "name": "Tizi N'berber",
    "ar_name": "تيزى نبربر",
    "wilaya_id": "6"
  },
  {
    "id": "227",
    "name": "Beni Maouch",
    "ar_name": "بني معوش",
    "wilaya_id": "6"
  },
  {
    "id": "228",
    "name": "Oued Ghir",
    "ar_name": "وادي غير",
    "wilaya_id": "6"
  },
  {
    "id": "229",
    "name": "Boudjellil",
    "ar_name": "بوجليل",
    "wilaya_id": "6"
  },
  {
    "id": "230",
    "name": "Biskra",
    "ar_name": "بسكرة",
    "wilaya_id": "7"
  },
  {
    "id": "231",
    "name": "Oumache",
    "ar_name": "أوماش",
    "wilaya_id": "7"
  },
  {
    "id": "232",
    "name": "Branis",
    "ar_name": "البرانس",
    "wilaya_id": "61"
  },
  {
    "id": "233",
    "name": "Chetma",
    "ar_name": "شتمة",
    "wilaya_id": "7"
  },
  {
    "id": "234",
    "name": "Ouled Djellal",
    "ar_name": "أولاد جلال",
    "wilaya_id": "51"
  },
  {
    "id": "235",
    "name": "Ras El Miaad",
    "ar_name": "راس الميعاد",
    "wilaya_id": "51"
  },
  {
    "id": "236",
    "name": "Besbes",
    "ar_name": "البسباس",
    "wilaya_id": "51"
  },
  {
    "id": "237",
    "name": "Sidi Khaled",
    "ar_name": "سيدي خالد",
    "wilaya_id": "51"
  },
  {
    "id": "238",
    "name": "Doucen",
    "ar_name": "الدوسن",
    "wilaya_id": "51"
  },
  {
    "id": "239",
    "name": "Ech Chaiba",
    "ar_name": "أولاد رحمة",
    "wilaya_id": "7"
  },
  {
    "id": "240",
    "name": "Sidi Okba",
    "ar_name": "سيدي عقبة",
    "wilaya_id": "7"
  },
  {
    "id": "241",
    "name": "Mchouneche",
    "ar_name": "مشونش",
    "wilaya_id": "7"
  },
  {
    "id": "242",
    "name": "El Haouch",
    "ar_name": "الحوش",
    "wilaya_id": "7"
  },
  {
    "id": "243",
    "name": "Ain Naga",
    "ar_name": "عين الناقة",
    "wilaya_id": "7"
  },
  {
    "id": "244",
    "name": "Zeribet El Oued",
    "ar_name": "زريبة الوادي",
    "wilaya_id": "7"
  },
  {
    "id": "245",
    "name": "El Feidh",
    "ar_name": "الفيض",
    "wilaya_id": "7"
  },
  {
    "id": "246",
    "name": "El Kantara",
    "ar_name": "القنطرة",
    "wilaya_id": "61"
  },
  {
    "id": "247",
    "name": "Ain Zaatout",
    "ar_name": "عين زعطوط",
    "wilaya_id": "61"
  },
  {
    "id": "248",
    "name": "El Outaya",
    "ar_name": "لوطاية",
    "wilaya_id": "61"
  },
  {
    "id": "249",
    "name": "Djemorah",
    "ar_name": "جمورة",
    "wilaya_id": "7"
  },
  {
    "id": "250",
    "name": "Tolga",
    "ar_name": "طولقة",
    "wilaya_id": "7"
  },
  {
    "id": "251",
    "name": "Lioua",
    "ar_name": "لواء",
    "wilaya_id": "7"
  },
  {
    "id": "252",
    "name": "Lichana",
    "ar_name": "لشانة",
    "wilaya_id": "7"
  },
  {
    "id": "253",
    "name": "Ourlal",
    "ar_name": "أورلال",
    "wilaya_id": "7"
  },
  {
    "id": "254",
    "name": "M'lili",
    "ar_name": "مليلي",
    "wilaya_id": "7"
  },
  {
    "id": "255",
    "name": "Foughala",
    "ar_name": "فوغالة",
    "wilaya_id": "7"
  },
  {
    "id": "256",
    "name": "Bordj Ben Azzouz",
    "ar_name": "برج بن عزوز",
    "wilaya_id": "7"
  },
  {
    "id": "257",
    "name": "M'ziraa",
    "ar_name": "مزيرعة",
    "wilaya_id": "7"
  },
  {
    "id": "258",
    "name": "Bouchagroun",
    "ar_name": "بوشقرون",
    "wilaya_id": "7"
  },
  {
    "id": "259",
    "name": "Mekhadma",
    "ar_name": "مخادمة",
    "wilaya_id": "7"
  },
  {
    "id": "260",
    "name": "El Ghrous",
    "ar_name": "الغروس",
    "wilaya_id": "7"
  },
  {
    "id": "261",
    "name": "El Hadjab",
    "ar_name": "الحاجب",
    "wilaya_id": "7"
  },
  {
    "id": "262",
    "name": "Khanguet Sidinadji",
    "ar_name": "خنڨة سيدي ناجي",
    "wilaya_id": "7"
  },
  {
    "id": "263",
    "name": "Bechar",
    "ar_name": "بشار",
    "wilaya_id": "8"
  },
  {
    "id": "264",
    "name": "Erg Ferradj",
    "ar_name": "عرق فراج",
    "wilaya_id": "8"
  },
  {
    "id": "265",
    "name": "Ouled Khoudir",
    "ar_name": "أولاد خدير",
    "wilaya_id": "52"
  },
  {
    "id": "266",
    "name": "Meridja",
    "ar_name": "مريجة",
    "wilaya_id": "8"
  },
  {
    "id": "267",
    "name": "Timoudi",
    "ar_name": "تيمودى",
    "wilaya_id": "52"
  },
  {
    "id": "268",
    "name": "Lahmar",
    "ar_name": "لحمر",
    "wilaya_id": "8"
  },
  {
    "id": "269",
    "name": "Beni Abbes",
    "ar_name": "بني عباس",
    "wilaya_id": "52"
  },
  {
    "id": "270",
    "name": "Beni Ikhlef",
    "ar_name": "بني يخلف",
    "wilaya_id": "8"
  },
  {
    "id": "271",
    "name": "Mechraa Houari Boumedienne",
    "ar_name": "مشرع ھوارى بومدين",
    "wilaya_id": "8"
  },
  {
    "id": "272",
    "name": "Kenedsa",
    "ar_name": "القنادسة",
    "wilaya_id": "8"
  },
  {
    "id": "273",
    "name": "Igli",
    "ar_name": "إقلي",
    "wilaya_id": "52"
  },
  {
    "id": "274",
    "name": "Tabalbala",
    "ar_name": "تبلبالة",
    "wilaya_id": "8"
  },
  {
    "id": "275",
    "name": "Taghit",
    "ar_name": "تــــاغـيــث",
    "wilaya_id": "8"
  },
  {
    "id": "276",
    "name": "El Ouata",
    "ar_name": "الوطى",
    "wilaya_id": "52"
  },
  {
    "id": "277",
    "name": "Boukais",
    "ar_name": "بوكايس",
    "wilaya_id": "8"
  },
  {
    "id": "278",
    "name": "Mogheul",
    "ar_name": "موغل",
    "wilaya_id": "8"
  },
  {
    "id": "279",
    "name": "Abadla",
    "ar_name": "العبادلة",
    "wilaya_id": "8"
  },
  {
    "id": "280",
    "name": "Kerzaz",
    "ar_name": "كرزاز",
    "wilaya_id": "52"
  },
  {
    "id": "281",
    "name": "Ksabi",
    "ar_name": "قصابى",
    "wilaya_id": "52"
  },
  {
    "id": "282",
    "name": "Tamtert",
    "ar_name": "تامترت",
    "wilaya_id": "8"
  },
  {
    "id": "283",
    "name": "Beni Ounif",
    "ar_name": "بني ونيف",
    "wilaya_id": "8"
  },
  {
    "id": "284",
    "name": "Blida",
    "ar_name": "البليدة‎",
    "wilaya_id": "9"
  },
  {
    "id": "285",
    "name": "Chebli",
    "ar_name": "الشبلي",
    "wilaya_id": "9"
  },
  {
    "id": "286",
    "name": "Bouinan",
    "ar_name": "بوعينان",
    "wilaya_id": "9"
  },
  {
    "id": "287",
    "name": "Oued El Alleug",
    "ar_name": "واد العلايڨ",
    "wilaya_id": "9"
  },
  {
    "id": "288",
    "name": "Ouled Yaich",
    "ar_name": "اولاد يعيش",
    "wilaya_id": "9"
  },
  {
    "id": "289",
    "name": "Chrea",
    "ar_name": "الشريعة",
    "wilaya_id": "9"
  },
  {
    "id": "290",
    "name": "El Affroun",
    "ar_name": "العفرون",
    "wilaya_id": "9"
  },
  {
    "id": "291",
    "name": "Chiffa",
    "ar_name": "الشفة",
    "wilaya_id": "9"
  },
  {
    "id": "292",
    "name": "Hammam Melouane",
    "ar_name": "حمام ملوان",
    "wilaya_id": "9"
  },
  {
    "id": "293",
    "name": "Ben Khlil",
    "ar_name": "بني خليل",
    "wilaya_id": "9"
  },
  {
    "id": "294",
    "name": "Soumaa",
    "ar_name": "صومعة",
    "wilaya_id": "9"
  },
  {
    "id": "295",
    "name": "Mouzaia",
    "ar_name": "موزاية",
    "wilaya_id": "9"
  },
  {
    "id": "296",
    "name": "Souhane",
    "ar_name": "صوحان",
    "wilaya_id": "9"
  },
  {
    "id": "297",
    "name": "Meftah",
    "ar_name": "مفتاح",
    "wilaya_id": "9"
  },
  {
    "id": "298",
    "name": "Ouled Selama",
    "ar_name": "أولاد سلامة",
    "wilaya_id": "9"
  },
  {
    "id": "299",
    "name": "Boufarik",
    "ar_name": "بوفاريك",
    "wilaya_id": "9"
  },
  {
    "id": "300",
    "name": "Larbaa",
    "ar_name": "الاربعاء",
    "wilaya_id": "9"
  },
  {
    "id": "301",
    "name": "Oued Djer",
    "ar_name": "واد جر",
    "wilaya_id": "9"
  },
  {
    "id": "302",
    "name": "Beni Tamou",
    "ar_name": "بني تامو",
    "wilaya_id": "9"
  },
  {
    "id": "303",
    "name": "Bouarfa",
    "ar_name": "بوعرفة",
    "wilaya_id": "9"
  },
  {
    "id": "304",
    "name": "Beni Mered",
    "ar_name": "بني مراد",
    "wilaya_id": "9"
  },
  {
    "id": "305",
    "name": "Bougara",
    "ar_name": "بوڨرة",
    "wilaya_id": "9"
  },
  {
    "id": "306",
    "name": "Guerrouaou",
    "ar_name": "ڨرواو",
    "wilaya_id": "9"
  },
  {
    "id": "307",
    "name": "Ain Romana",
    "ar_name": "عين الرمانة",
    "wilaya_id": "9"
  },
  {
    "id": "308",
    "name": "Djebabra",
    "ar_name": "جبابرة",
    "wilaya_id": "9"
  },
  {
    "id": "309",
    "name": "Bouira",
    "ar_name": "البويرة",
    "wilaya_id": "10"
  },
  {
    "id": "310",
    "name": "El Asnam",
    "ar_name": "الأصنام",
    "wilaya_id": "10"
  },
  {
    "id": "311",
    "name": "Guerrouma",
    "ar_name": "قرومة",
    "wilaya_id": "10"
  },
  {
    "id": "312",
    "name": "Souk El Khemis",
    "ar_name": "سوق الخميس",
    "wilaya_id": "10"
  },
  {
    "id": "313",
    "name": "Kadiria",
    "ar_name": "قادرية",
    "wilaya_id": "10"
  },
  {
    "id": "314",
    "name": "Hanif",
    "ar_name": "احنيف",
    "wilaya_id": "10"
  },
  {
    "id": "315",
    "name": "Dirah",
    "ar_name": "ديــرة",
    "wilaya_id": "10"
  },
  {
    "id": "316",
    "name": "Ait Laaziz",
    "ar_name": "آيت لعزيز",
    "wilaya_id": "10"
  },
  {
    "id": "317",
    "name": "Taghzout",
    "ar_name": "تاغزوت",
    "wilaya_id": "10"
  },
  {
    "id": "318",
    "name": "Raouraoua",
    "ar_name": "الروراوة",
    "wilaya_id": "10"
  },
  {
    "id": "319",
    "name": "Mezdour",
    "ar_name": "مسدور",
    "wilaya_id": "10"
  },
  {
    "id": "320",
    "name": "Haizer",
    "ar_name": "حيزر",
    "wilaya_id": "10"
  },
  {
    "id": "321",
    "name": "Lakhdaria",
    "ar_name": "الأخضرية",
    "wilaya_id": "10"
  },
  {
    "id": "322",
    "name": "Maala",
    "ar_name": "معالة",
    "wilaya_id": "10"
  },
  {
    "id": "323",
    "name": "El Hachimia",
    "ar_name": "الھاشمية",
    "wilaya_id": "10"
  },
  {
    "id": "324",
    "name": "Aomar",
    "ar_name": "أعمر",
    "wilaya_id": "10"
  },
  {
    "id": "325",
    "name": "Chorfa",
    "ar_name": "الشرفاء",
    "wilaya_id": "10"
  },
  {
    "id": "326",
    "name": "Bordj Oukhriss",
    "ar_name": "برج أوخريص",
    "wilaya_id": "10"
  },
  {
    "id": "327",
    "name": "El Adjiba",
    "ar_name": "العجيبة",
    "wilaya_id": "10"
  },
  {
    "id": "328",
    "name": "El Hakimia",
    "ar_name": "الحاكمية",
    "wilaya_id": "10"
  },
  {
    "id": "329",
    "name": "El Khebouzia",
    "ar_name": "الخبوزية",
    "wilaya_id": "10"
  },
  {
    "id": "330",
    "name": "Ahl El Ksar",
    "ar_name": "أھل القصر",
    "wilaya_id": "10"
  },
  {
    "id": "331",
    "name": "Bouderbala",
    "ar_name": "بودربالة",
    "wilaya_id": "10"
  },
  {
    "id": "332",
    "name": "Zbarbar",
    "ar_name": "زبربر",
    "wilaya_id": "10"
  },
  {
    "id": "333",
    "name": "Ain El Hadjar",
    "ar_name": "عين الحجر",
    "wilaya_id": "10"
  },
  {
    "id": "334",
    "name": "Djebahia",
    "ar_name": "الجباحية",
    "wilaya_id": "10"
  },
  {
    "id": "335",
    "name": "Aghbalou",
    "ar_name": "أغبالو",
    "wilaya_id": "10"
  },
  {
    "id": "336",
    "name": "Taguedit",
    "ar_name": "تاڨديت",
    "wilaya_id": "10"
  },
  {
    "id": "337",
    "name": "Ain Turk",
    "ar_name": "عين الترك",
    "wilaya_id": "10"
  },
  {
    "id": "338",
    "name": "Saharidj",
    "ar_name": "الصهاريج",
    "wilaya_id": "10"
  },
  {
    "id": "339",
    "name": "Dechmia",
    "ar_name": "الدشمية",
    "wilaya_id": "10"
  },
  {
    "id": "340",
    "name": "Ridane",
    "ar_name": "ريدان",
    "wilaya_id": "10"
  },
  {
    "id": "341",
    "name": "Bechloul",
    "ar_name": "بشلول",
    "wilaya_id": "10"
  },
  {
    "id": "342",
    "name": "Boukram",
    "ar_name": "بوكرام",
    "wilaya_id": "10"
  },
  {
    "id": "343",
    "name": "Ain Bessam",
    "ar_name": "عين بسام",
    "wilaya_id": "10"
  },
  {
    "id": "344",
    "name": "Bir Ghbalou",
    "ar_name": "بئر غبالو",
    "wilaya_id": "10"
  },
  {
    "id": "345",
    "name": "Mchedallah",
    "ar_name": "مشدا الله",
    "wilaya_id": "10"
  },
  {
    "id": "346",
    "name": "Sour El Ghozlane",
    "ar_name": "سور الغزلان",
    "wilaya_id": "10"
  },
  {
    "id": "347",
    "name": "Maamora",
    "ar_name": "المعمورة",
    "wilaya_id": "10"
  },
  {
    "id": "348",
    "name": "Ouled Rached",
    "ar_name": "أولاد راشد",
    "wilaya_id": "10"
  },
  {
    "id": "349",
    "name": "Ain Laloui",
    "ar_name": "عين العلوي",
    "wilaya_id": "10"
  },
  {
    "id": "350",
    "name": "Hadjera Zerga",
    "ar_name": "الحجرة الزرقاء",
    "wilaya_id": "10"
  },
  {
    "id": "351",
    "name": "Ath Mansour",
    "ar_name": "آث منصور",
    "wilaya_id": "10"
  },
  {
    "id": "352",
    "name": "El Mokrani",
    "ar_name": "المقراني",
    "wilaya_id": "10"
  },
  {
    "id": "353",
    "name": "Oued El Berdi",
    "ar_name": "وادى البردي",
    "wilaya_id": "10"
  },
  {
    "id": "354",
    "name": "Tamanghasset",
    "ar_name": "تمنراست",
    "wilaya_id": "11"
  },
  {
    "id": "355",
    "name": "Abalessa",
    "ar_name": "أبلسة",
    "wilaya_id": "11"
  },
  {
    "id": "356",
    "name": "In Ghar",
    "ar_name": "عـيـن غــار",
    "wilaya_id": "53"
  },
  {
    "id": "357",
    "name": "In Guezzam",
    "ar_name": "عين قزام",
    "wilaya_id": "54"
  },
  {
    "id": "358",
    "name": "Idles",
    "ar_name": "إدلس",
    "wilaya_id": "11"
  },
  {
    "id": "359",
    "name": "Tazouk",
    "ar_name": "تاظروك",
    "wilaya_id": "11"
  },
  {
    "id": "360",
    "name": "Tinzaouatine",
    "ar_name": "تين زاوتين",
    "wilaya_id": "11"
  },
  {
    "id": "361",
    "name": "In Salah",
    "ar_name": "عين صالح",
    "wilaya_id": "53"
  },
  {
    "id": "362",
    "name": "In Amguel",
    "ar_name": "ان أمقل",
    "wilaya_id": "11"
  },
  {
    "id": "363",
    "name": "Foggaret Ezzaouia",
    "ar_name": "فقارة الزوى",
    "wilaya_id": "53"
  },
  {
    "id": "364",
    "name": "Tebessa",
    "ar_name": "تبسة",
    "wilaya_id": "12"
  },
  {
    "id": "365",
    "name": "Bir El Ater",
    "ar_name": "بئر العاتر",
    "wilaya_id": "62"
  },
  {
    "id": "366",
    "name": "Cheria",
    "ar_name": "الــشــريــعـة",
    "wilaya_id": "12"
  },
  {
    "id": "367",
    "name": "Stah Guentis",
    "ar_name": "سطح قنطيس",
    "wilaya_id": "12"
  },
  {
    "id": "368",
    "name": "El Aouinet",
    "ar_name": "العوينات",
    "wilaya_id": "12"
  },
  {
    "id": "369",
    "name": "Lahouidjbet",
    "ar_name": "الحويجبات",
    "wilaya_id": "12"
  },
  {
    "id": "370",
    "name": "Safsaf El Ouesra",
    "ar_name": "صفصاف الوسرة",
    "wilaya_id": "12"
  },
  {
    "id": "371",
    "name": "Hammamet",
    "ar_name": "الحمامات",
    "wilaya_id": "12"
  },
  {
    "id": "372",
    "name": "Negrine",
    "ar_name": "نقرين",
    "wilaya_id": "62"
  },
  {
    "id": "373",
    "name": "Bir El Mokadem",
    "ar_name": "بــئــر مــقـدم",
    "wilaya_id": "12"
  },
  {
    "id": "374",
    "name": "El Kouif",
    "ar_name": "الكويف",
    "wilaya_id": "12"
  },
  {
    "id": "375",
    "name": "Morsott",
    "ar_name": "مرسط",
    "wilaya_id": "12"
  },
  {
    "id": "376",
    "name": "El Ogla",
    "ar_name": "العقلة",
    "wilaya_id": "62"
  },
  {
    "id": "377",
    "name": "Bir Dheb",
    "ar_name": "بٔير الذھب",
    "wilaya_id": "12"
  },
  {
    "id": "378",
    "name": "El Ogla",
    "ar_name": "العقلة",
    "wilaya_id": "12"
  },
  {
    "id": "379",
    "name": "Gorriguer",
    "ar_name": "قوريقر",
    "wilaya_id": "12"
  },
  {
    "id": "380",
    "name": "Bekkaria",
    "ar_name": "بكارية",
    "wilaya_id": "12"
  },
  {
    "id": "381",
    "name": "Boukhadra",
    "ar_name": "بوخضرة",
    "wilaya_id": "12"
  },
  {
    "id": "382",
    "name": "Ouenza",
    "ar_name": "الونزة",
    "wilaya_id": "12"
  },
  {
    "id": "383",
    "name": "El Ma El Biodh",
    "ar_name": "الماء الأبيض",
    "wilaya_id": "12"
  },
  {
    "id": "384",
    "name": "Oum Ali",
    "ar_name": "أم على",
    "wilaya_id": "12"
  },
  {
    "id": "385",
    "name": "Tlidjene",
    "ar_name": "ثليجان",
    "wilaya_id": "12"
  },
  {
    "id": "386",
    "name": "Ain Zerga",
    "ar_name": "عين الزرقاء",
    "wilaya_id": "12"
  },
  {
    "id": "387",
    "name": "El Meridj",
    "ar_name": "المريج",
    "wilaya_id": "12"
  },
  {
    "id": "388",
    "name": "Boulhaf Dyr",
    "ar_name": "بولحاف الدير",
    "wilaya_id": "12"
  },
  {
    "id": "389",
    "name": "Bedjene",
    "ar_name": "بجن",
    "wilaya_id": "12"
  },
  {
    "id": "390",
    "name": "El Mazeraa",
    "ar_name": "المزرعة",
    "wilaya_id": "12"
  },
  {
    "id": "391",
    "name": "Ferkane",
    "ar_name": "فـــــــركـــــان",
    "wilaya_id": "62"
  },
  {
    "id": "392",
    "name": "Tlemcen",
    "ar_name": "تلمسان",
    "wilaya_id": "13"
  },
  {
    "id": "393",
    "name": "Beni Mester",
    "ar_name": "بني مستار",
    "wilaya_id": "13"
  },
  {
    "id": "394",
    "name": "Ain Tallout",
    "ar_name": "عين تالوت",
    "wilaya_id": "13"
  },
  {
    "id": "395",
    "name": "Remchi",
    "ar_name": "الرمشي",
    "wilaya_id": "13"
  },
  {
    "id": "396",
    "name": "El Fehoul",
    "ar_name": "الفحول",
    "wilaya_id": "13"
  },
  {
    "id": "397",
    "name": "Sabra",
    "ar_name": "صبرة",
    "wilaya_id": "13"
  },
  {
    "id": "398",
    "name": "Ghazaouet",
    "ar_name": "الغزوات",
    "wilaya_id": "13"
  },
  {
    "id": "399",
    "name": "Souani",
    "ar_name": "السواني",
    "wilaya_id": "13"
  },
  {
    "id": "400",
    "name": "Djebala",
    "ar_name": "جبالة",
    "wilaya_id": "13"
  },
  {
    "id": "401",
    "name": "El Gor",
    "ar_name": "الغور",
    "wilaya_id": "63"
  },
  {
    "id": "402",
    "name": "Oued Chouly",
    "ar_name": "وادى الشولى",
    "wilaya_id": "13"
  },
  {
    "id": "403",
    "name": "Ain Fezza",
    "ar_name": "عين فزّة",
    "wilaya_id": "13"
  },
  {
    "id": "404",
    "name": "Ouled Mimoun",
    "ar_name": "أولاد ميمون",
    "wilaya_id": "13"
  },
  {
    "id": "405",
    "name": "Amieur",
    "ar_name": "عمير",
    "wilaya_id": "13"
  },
  {
    "id": "406",
    "name": "Ain Youcef",
    "ar_name": "عين يوسف",
    "wilaya_id": "13"
  },
  {
    "id": "407",
    "name": "Zenata",
    "ar_name": "زناتة",
    "wilaya_id": "13"
  },
  {
    "id": "408",
    "name": "Beni Snous",
    "ar_name": "بنى سنوس",
    "wilaya_id": "13"
  },
  {
    "id": "409",
    "name": "Bab El Assa",
    "ar_name": "باب العسة",
    "wilaya_id": "13"
  },
  {
    "id": "410",
    "name": "Dar Yaghmouracene",
    "ar_name": "دار يغمراسن",
    "wilaya_id": "13"
  },
  {
    "id": "411",
    "name": "Fellaoucene",
    "ar_name": "فلاوسن",
    "wilaya_id": "13"
  },
  {
    "id": "412",
    "name": "Azails",
    "ar_name": "العزايل",
    "wilaya_id": "13"
  },
  {
    "id": "413",
    "name": "Sebbaa Chioukh",
    "ar_name": "سبعة شيوخ",
    "wilaya_id": "13"
  },
  {
    "id": "414",
    "name": "Terni Beni Hediel",
    "ar_name": "تيرني بني هديل",
    "wilaya_id": "13"
  },
  {
    "id": "415",
    "name": "Bensekrane",
    "ar_name": "بن سكران",
    "wilaya_id": "13"
  },
  {
    "id": "416",
    "name": "Ain Nehala",
    "ar_name": "عين نحالة",
    "wilaya_id": "13"
  },
  {
    "id": "417",
    "name": "Hennaya",
    "ar_name": "الحناية",
    "wilaya_id": "13"
  },
  {
    "id": "418",
    "name": "Maghnia",
    "ar_name": "مغنية",
    "wilaya_id": "13"
  },
  {
    "id": "419",
    "name": "Hammam Boughrara",
    "ar_name": "حمام بوغرارة",
    "wilaya_id": "13"
  },
  {
    "id": "420",
    "name": "Souahlia",
    "ar_name": "تونان",
    "wilaya_id": "13"
  },
  {
    "id": "421",
    "name": "Msirda Fouaga",
    "ar_name": "مسيردة الفواقة",
    "wilaya_id": "13"
  },
  {
    "id": "422",
    "name": "Ain Fetah",
    "ar_name": "عين فتاح",
    "wilaya_id": "13"
  },
  {
    "id": "423",
    "name": "El Aricha",
    "ar_name": "العريشة",
    "wilaya_id": "63"
  },
  {
    "id": "424",
    "name": "Souk Thlata",
    "ar_name": "سوق الثلاثاء",
    "wilaya_id": "13"
  },
  {
    "id": "425",
    "name": "Sidi Abdelli",
    "ar_name": "سيدي العبدلي",
    "wilaya_id": "13"
  },
  {
    "id": "426",
    "name": "Sebdou",
    "ar_name": "سبدو",
    "wilaya_id": "13"
  },
  {
    "id": "427",
    "name": "Beni Ouarsous",
    "ar_name": "برج عريمة",
    "wilaya_id": "13"
  },
  {
    "id": "428",
    "name": "Sidi Medjahed",
    "ar_name": "سيدي مجاهد",
    "wilaya_id": "13"
  },
  {
    "id": "429",
    "name": "Beni Boussaid",
    "ar_name": "بني بوسعيد",
    "wilaya_id": "13"
  },
  {
    "id": "430",
    "name": "Marsa Ben Mhidi",
    "ar_name": "مرسى بن مھيدي",
    "wilaya_id": "13"
  },
  {
    "id": "431",
    "name": "Nedroma",
    "ar_name": "ندرومة",
    "wilaya_id": "13"
  },
  {
    "id": "432",
    "name": "Sidi Djillali",
    "ar_name": "سيدي الجيلالي",
    "wilaya_id": "13"
  },
  {
    "id": "433",
    "name": "Beni Bahdel",
    "ar_name": "بني بهدل",
    "wilaya_id": "13"
  },
  {
    "id": "434",
    "name": "El Bouihi",
    "ar_name": "البويھي",
    "wilaya_id": "13"
  },
  {
    "id": "435",
    "name": "Honaine",
    "ar_name": "هنين",
    "wilaya_id": "13"
  },
  {
    "id": "436",
    "name": "Tianet",
    "ar_name": "تيانت",
    "wilaya_id": "13"
  },
  {
    "id": "437",
    "name": "Ouled Riyah",
    "ar_name": "أولاد رياح",
    "wilaya_id": "13"
  },
  {
    "id": "438",
    "name": "Bouhlou",
    "ar_name": "بوحلو",
    "wilaya_id": "13"
  },
  {
    "id": "439",
    "name": "Souk El Khemis",
    "ar_name": "سوق الخميس",
    "wilaya_id": "13"
  },
  {
    "id": "440",
    "name": "Ain Ghoraba",
    "ar_name": "عين غرابة",
    "wilaya_id": "13"
  },
  {
    "id": "441",
    "name": "Chetouane",
    "ar_name": "شتوان",
    "wilaya_id": "13"
  },
  {
    "id": "442",
    "name": "Mansourah",
    "ar_name": "المنصورة",
    "wilaya_id": "13"
  },
  {
    "id": "443",
    "name": "Beni Semiel",
    "ar_name": "بني مستار",
    "wilaya_id": "13"
  },
  {
    "id": "444",
    "name": "Ain Kebira",
    "ar_name": "عين الكبيرة",
    "wilaya_id": "13"
  },
  {
    "id": "445",
    "name": "Tiaret",
    "ar_name": "تيارت‎",
    "wilaya_id": "14"
  },
  {
    "id": "446",
    "name": "Medroussa",
    "ar_name": "مدروسة",
    "wilaya_id": "14"
  },
  {
    "id": "447",
    "name": "Ain Bouchekif",
    "ar_name": "بوشقيف",
    "wilaya_id": "14"
  },
  {
    "id": "448",
    "name": "Sidi Ali Mellal",
    "ar_name": "سيدي علي ملال",
    "wilaya_id": "14"
  },
  {
    "id": "449",
    "name": "Ain Zarit",
    "ar_name": "عين زاريت",
    "wilaya_id": "14"
  },
  {
    "id": "450",
    "name": "Ain Deheb",
    "ar_name": "عين الذهب",
    "wilaya_id": "14"
  },
  {
    "id": "451",
    "name": "Sidi Bakhti",
    "ar_name": "سيدي بختي",
    "wilaya_id": "14"
  },
  {
    "id": "452",
    "name": "Medrissa",
    "ar_name": "مدريسة",
    "wilaya_id": "14"
  },
  {
    "id": "453",
    "name": "Zmalet El Emir Aek",
    "ar_name": "زمالة الأمير عبد القادر",
    "wilaya_id": "14"
  },
  {
    "id": "454",
    "name": "Madna",
    "ar_name": "مادنة",
    "wilaya_id": "14"
  },
  {
    "id": "455",
    "name": "Sebt",
    "ar_name": "السبت",
    "wilaya_id": "14"
  },
  {
    "id": "456",
    "name": "Mellakou",
    "ar_name": "ملاكو",
    "wilaya_id": "14"
  },
  {
    "id": "457",
    "name": "Dahmouni",
    "ar_name": "دحموني",
    "wilaya_id": "14"
  },
  {
    "id": "458",
    "name": "Rahouia",
    "ar_name": "رحوية",
    "wilaya_id": "14"
  },
  {
    "id": "459",
    "name": "Mahdia",
    "ar_name": "المھدية",
    "wilaya_id": "14"
  },
  {
    "id": "460",
    "name": "Sougueur",
    "ar_name": "سوقر",
    "wilaya_id": "14"
  },
  {
    "id": "461",
    "name": "Sidi Abdelghani",
    "ar_name": "سيدي عبد الغنى",
    "wilaya_id": "64"
  },
  {
    "id": "462",
    "name": "Ain El Hadid",
    "ar_name": "عين الحديد",
    "wilaya_id": "14"
  },
  {
    "id": "463",
    "name": "Ouled Djerad",
    "ar_name": "اولاد جراد",
    "wilaya_id": "14"
  },
  {
    "id": "464",
    "name": "Naima",
    "ar_name": "نعيمة",
    "wilaya_id": "14"
  },
  {
    "id": "465",
    "name": "Meghila",
    "ar_name": "مغيلة",
    "wilaya_id": "14"
  },
  {
    "id": "466",
    "name": "Guertoufa",
    "ar_name": "قرطوفة",
    "wilaya_id": "14"
  },
  {
    "id": "467",
    "name": "Sidi Hosni",
    "ar_name": "سيدي حسني",
    "wilaya_id": "14"
  },
  {
    "id": "468",
    "name": "Djillali Ben Amar",
    "ar_name": "جيلالي بن عمار",
    "wilaya_id": "14"
  },
  {
    "id": "469",
    "name": "Sebaine",
    "ar_name": "سبعين",
    "wilaya_id": "14"
  },
  {
    "id": "470",
    "name": "Tousnina",
    "ar_name": "توسنينة",
    "wilaya_id": "14"
  },
  {
    "id": "471",
    "name": "Frenda",
    "ar_name": "فرندة",
    "wilaya_id": "14"
  },
  {
    "id": "472",
    "name": "Ain Kermes",
    "ar_name": "عين كرمس",
    "wilaya_id": "14"
  },
  {
    "id": "473",
    "name": "Ksar Chellala",
    "ar_name": "قصر الشلالة",
    "wilaya_id": "64"
  },
  {
    "id": "474",
    "name": "Rechaiga",
    "ar_name": "الرشايقة",
    "wilaya_id": "64"
  },
  {
    "id": "475",
    "name": "Nadorah",
    "ar_name": "ملاكو",
    "wilaya_id": "14"
  },
  {
    "id": "476",
    "name": "Tagdemt",
    "ar_name": "تاقدمت",
    "wilaya_id": "14"
  },
  {
    "id": "477",
    "name": "Oued Lilli",
    "ar_name": "وادى ليلى",
    "wilaya_id": "14"
  },
  {
    "id": "478",
    "name": "Mechraa Safa",
    "ar_name": "مشرع الصفاء",
    "wilaya_id": "14"
  },
  {
    "id": "479",
    "name": "Hamadia",
    "ar_name": "الحمادية",
    "wilaya_id": "64"
  },
  {
    "id": "480",
    "name": "Chehaima",
    "ar_name": "شحيمة",
    "wilaya_id": "14"
  },
  {
    "id": "481",
    "name": "Takhemaret",
    "ar_name": "تاخمرت",
    "wilaya_id": "14"
  },
  {
    "id": "482",
    "name": "Sidi Abderrahmane",
    "ar_name": "سيدي عبدالرحمان",
    "wilaya_id": "14"
  },
  {
    "id": "483",
    "name": "Serghine",
    "ar_name": "سرغين",
    "wilaya_id": "64"
  },
  {
    "id": "484",
    "name": "Bougara",
    "ar_name": "بوقرة",
    "wilaya_id": "64"
  },
  {
    "id": "485",
    "name": "Faidja",
    "ar_name": "الفايجة",
    "wilaya_id": "14"
  },
  {
    "id": "486",
    "name": "Tidda",
    "ar_name": "تيدة",
    "wilaya_id": "14"
  },
  {
    "id": "487",
    "name": "Tizi Ouzou",
    "ar_name": "تيزي وزو",
    "wilaya_id": "15"
  },
  {
    "id": "488",
    "name": "Ain El Hammam",
    "ar_name": "عين الحمام",
    "wilaya_id": "15"
  },
  {
    "id": "489",
    "name": "Akbil",
    "ar_name": "أقبيل",
    "wilaya_id": "15"
  },
  {
    "id": "490",
    "name": "Freha",
    "ar_name": "فريحة",
    "wilaya_id": "15"
  },
  {
    "id": "491",
    "name": "Souamaa",
    "ar_name": "صوامع",
    "wilaya_id": "15"
  },
  {
    "id": "492",
    "name": "Mechtrass",
    "ar_name": "مشطراس",
    "wilaya_id": "15"
  },
  {
    "id": "493",
    "name": "Irdjen",
    "ar_name": "إرجن",
    "wilaya_id": "15"
  },
  {
    "id": "494",
    "name": "Timizart",
    "ar_name": "تيميزارت",
    "wilaya_id": "15"
  },
  {
    "id": "495",
    "name": "Makouda",
    "ar_name": "ماكودة",
    "wilaya_id": "15"
  },
  {
    "id": "496",
    "name": "Draa El Mizan",
    "ar_name": "ذراع الميزان",
    "wilaya_id": "15"
  },
  {
    "id": "497",
    "name": "Tizi Ghenif",
    "ar_name": "تيزي غنيف",
    "wilaya_id": "15"
  },
  {
    "id": "498",
    "name": "Bounouh",
    "ar_name": "بونوح",
    "wilaya_id": "15"
  },
  {
    "id": "499",
    "name": "Ait Chaffaa",
    "ar_name": "آيت شفعة",
    "wilaya_id": "15"
  },
  {
    "id": "500",
    "name": "Frikat",
    "ar_name": "فريقات",
    "wilaya_id": "15"
  },
  {
    "id": "501",
    "name": "Beni Aissi",
    "ar_name": "بني عيسي",
    "wilaya_id": "15"
  },
  {
    "id": "502",
    "name": "Beni Zmenzer",
    "ar_name": "أيت زمنزر",
    "wilaya_id": "15"
  },
  {
    "id": "503",
    "name": "Iferhounene",
    "ar_name": "إيفرحونن",
    "wilaya_id": "15"
  },
  {
    "id": "504",
    "name": "Azazga",
    "ar_name": "عزازقة",
    "wilaya_id": "15"
  },
  {
    "id": "505",
    "name": "Iloula Oumalou",
    "ar_name": "إيلولة أمالو",
    "wilaya_id": "15"
  },
  {
    "id": "506",
    "name": "Yakouren",
    "ar_name": "اعكورن",
    "wilaya_id": "15"
  },
  {
    "id": "507",
    "name": "Larba Nait Irathen",
    "ar_name": "الأربعاء نايت إيراثن",
    "wilaya_id": "15"
  },
  {
    "id": "508",
    "name": "Tizi Rached",
    "ar_name": "تيزي راشد",
    "wilaya_id": "15"
  },
  {
    "id": "509",
    "name": "Zekri",
    "ar_name": "زكري",
    "wilaya_id": "15"
  },
  {
    "id": "510",
    "name": "Ouaguenoun",
    "ar_name": "واقنون",
    "wilaya_id": "15"
  },
  {
    "id": "511",
    "name": "Ain Zaouia",
    "ar_name": "عين الزاوية",
    "wilaya_id": "15"
  },
  {
    "id": "512",
    "name": "Mkira",
    "ar_name": "مكيرة",
    "wilaya_id": "15"
  },
  {
    "id": "513",
    "name": "Ait Yahia",
    "ar_name": "أيت يحي",
    "wilaya_id": "15"
  },
  {
    "id": "514",
    "name": "Ait Mahmoud",
    "ar_name": "أيت محمود",
    "wilaya_id": "15"
  },
  {
    "id": "515",
    "name": "Maatka",
    "ar_name": "المعاتقة",
    "wilaya_id": "15"
  },
  {
    "id": "516",
    "name": "Ait Boumehdi",
    "ar_name": "آيت بومھدى",
    "wilaya_id": "15"
  },
  {
    "id": "517",
    "name": "Abi Youcef",
    "ar_name": "أبي يوسف",
    "wilaya_id": "15"
  },
  {
    "id": "518",
    "name": "Beni Douala",
    "ar_name": "بني دوالة",
    "wilaya_id": "15"
  },
  {
    "id": "519",
    "name": "Illilten",
    "ar_name": "إليلتن",
    "wilaya_id": "15"
  },
  {
    "id": "520",
    "name": "Bouzguen",
    "ar_name": "بوزقن",
    "wilaya_id": "15"
  },
  {
    "id": "521",
    "name": "Ait Aggouacha",
    "ar_name": "أيت أقواشة",
    "wilaya_id": "15"
  },
  {
    "id": "522",
    "name": "Ouadhia",
    "ar_name": "واضية",
    "wilaya_id": "15"
  },
  {
    "id": "523",
    "name": "Azzefoun",
    "ar_name": "أزفون",
    "wilaya_id": "15"
  },
  {
    "id": "524",
    "name": "Tigzirt",
    "ar_name": "تقزيرت",
    "wilaya_id": "15"
  },
  {
    "id": "525",
    "name": "Ait Aissa Mimoun",
    "ar_name": "آيت عيسى ميمون",
    "wilaya_id": "15"
  },
  {
    "id": "526",
    "name": "Boghni",
    "ar_name": "بوغني",
    "wilaya_id": "15"
  },
  {
    "id": "527",
    "name": "Ifigha",
    "ar_name": "ايفيغاء",
    "wilaya_id": "15"
  },
  {
    "id": "528",
    "name": "Ait Oumalou",
    "ar_name": "آيت أومالو",
    "wilaya_id": "15"
  },
  {
    "id": "529",
    "name": "Tirmitine",
    "ar_name": "ترمتين",
    "wilaya_id": "15"
  },
  {
    "id": "530",
    "name": "Akerrou",
    "ar_name": "أقرو",
    "wilaya_id": "15"
  },
  {
    "id": "531",
    "name": "Yatafen",
    "ar_name": "يطافن",
    "wilaya_id": "15"
  },
  {
    "id": "532",
    "name": "Beni Ziki",
    "ar_name": "بنى زيكى",
    "wilaya_id": "15"
  },
  {
    "id": "533",
    "name": "Draa Ben Khedda",
    "ar_name": "ذراع بن خدة",
    "wilaya_id": "15"
  },
  {
    "id": "534",
    "name": "Ouacif",
    "ar_name": "واسيف",
    "wilaya_id": "15"
  },
  {
    "id": "535",
    "name": "Idjeur",
    "ar_name": "آجر",
    "wilaya_id": "15"
  },
  {
    "id": "536",
    "name": "Mekla",
    "ar_name": "مقلع",
    "wilaya_id": "15"
  },
  {
    "id": "537",
    "name": "Tizi Nthlata",
    "ar_name": "تيزي نثلاثة",
    "wilaya_id": "15"
  },
  {
    "id": "538",
    "name": "Beni Yenni",
    "ar_name": "بني يني",
    "wilaya_id": "15"
  },
  {
    "id": "539",
    "name": "Aghrib",
    "ar_name": "أغريب",
    "wilaya_id": "15"
  },
  {
    "id": "540",
    "name": "Iflissen",
    "ar_name": "إفليسن",
    "wilaya_id": "15"
  },
  {
    "id": "541",
    "name": "Boudjima",
    "ar_name": "بوجيمة",
    "wilaya_id": "15"
  },
  {
    "id": "542",
    "name": "Ait Yahia Moussa",
    "ar_name": "أيت يحي موسى",
    "wilaya_id": "15"
  },
  {
    "id": "543",
    "name": "Souk El Thenine",
    "ar_name": "سوق الإثنين",
    "wilaya_id": "15"
  },
  {
    "id": "544",
    "name": "Ait Khelil",
    "ar_name": "أيت خليلي",
    "wilaya_id": "15"
  },
  {
    "id": "545",
    "name": "Sidi Naamane",
    "ar_name": "سيدي نعمان",
    "wilaya_id": "15"
  },
  {
    "id": "546",
    "name": "Iboudraren",
    "ar_name": "أبودرارن",
    "wilaya_id": "15"
  },
  {
    "id": "547",
    "name": "Agouni Gueghrane",
    "ar_name": "آقنى قغران",
    "wilaya_id": "15"
  },
  {
    "id": "548",
    "name": "Mizrana",
    "ar_name": "مزرانة",
    "wilaya_id": "15"
  },
  {
    "id": "549",
    "name": "Imsouhal",
    "ar_name": "إمسوحال",
    "wilaya_id": "15"
  },
  {
    "id": "550",
    "name": "Tadmait",
    "ar_name": "تادمايت",
    "wilaya_id": "15"
  },
  {
    "id": "551",
    "name": "Ait Bouadou",
    "ar_name": "أيت بوعدو",
    "wilaya_id": "15"
  },
  {
    "id": "552",
    "name": "Assi Youcef",
    "ar_name": "أسي يوسف",
    "wilaya_id": "15"
  },
  {
    "id": "553",
    "name": "Ait Toudert",
    "ar_name": "أيت تودرت",
    "wilaya_id": "15"
  },
  {
    "id": "554",
    "name": "Alger Centre",
    "ar_name": "الجزائر الوسطى",
    "wilaya_id": "16"
  },
  {
    "id": "555",
    "name": "Sidi Mhamed",
    "ar_name": "سيدي امحمد",
    "wilaya_id": "16"
  },
  {
    "id": "556",
    "name": "El Madania",
    "ar_name": "المدنية",
    "wilaya_id": "16"
  },
  {
    "id": "557",
    "name": "Belouizdad",
    "ar_name": "بلوزداد",
    "wilaya_id": "16"
  },
  {
    "id": "558",
    "name": "Bab El Oued",
    "ar_name": "باب الواد",
    "wilaya_id": "16"
  },
  {
    "id": "559",
    "name": "Bologhine",
    "ar_name": "بولوغين",
    "wilaya_id": "16"
  },
  {
    "id": "560",
    "name": "Casbah",
    "ar_name": "القصبة",
    "wilaya_id": "16"
  },
  {
    "id": "561",
    "name": "Oued Koriche",
    "ar_name": "وادي قريش",
    "wilaya_id": "16"
  },
  {
    "id": "562",
    "name": "Bir Mourad Rais",
    "ar_name": "بير مراد رايس",
    "wilaya_id": "16"
  },
  {
    "id": "563",
    "name": "El Biar",
    "ar_name": "الآبيار",
    "wilaya_id": "16"
  },
  {
    "id": "564",
    "name": "Bouzareah",
    "ar_name": "بوزريعة",
    "wilaya_id": "16"
  },
  {
    "id": "565",
    "name": "Birkhadem",
    "ar_name": "بئر خادم",
    "wilaya_id": "16"
  },
  {
    "id": "566",
    "name": "El Harrach",
    "ar_name": "الحراش",
    "wilaya_id": "16"
  },
  {
    "id": "567",
    "name": "Baraki",
    "ar_name": "براقي",
    "wilaya_id": "16"
  },
  {
    "id": "568",
    "name": "Oued Smar",
    "ar_name": "وادي سمار",
    "wilaya_id": "16"
  },
  {
    "id": "569",
    "name": "Bourouba",
    "ar_name": "بوروبة",
    "wilaya_id": "16"
  },
  {
    "id": "570",
    "name": "Hussein Dey",
    "ar_name": "حسين داي",
    "wilaya_id": "16"
  },
  {
    "id": "571",
    "name": "Kouba",
    "ar_name": "القبة",
    "wilaya_id": "16"
  },
  {
    "id": "572",
    "name": "Bachedjerah",
    "ar_name": "باش جراح",
    "wilaya_id": "16"
  },
  {
    "id": "573",
    "name": "Dar El Beida",
    "ar_name": "الدار البيضاء",
    "wilaya_id": "16"
  },
  {
    "id": "574",
    "name": "Bab Azzouar",
    "ar_name": "باب الزوار",
    "wilaya_id": "16"
  },
  {
    "id": "575",
    "name": "Ben Aknoun",
    "ar_name": "بن عكنون",
    "wilaya_id": "16"
  },
  {
    "id": "576",
    "name": "Dely Ibrahim",
    "ar_name": "دالي ابراهيم",
    "wilaya_id": "16"
  },
  {
    "id": "577",
    "name": "El Hammamet",
    "ar_name": "الحمامات",
    "wilaya_id": "16"
  },
  {
    "id": "578",
    "name": "Rais Hamidou",
    "ar_name": "الرايس حميدو",
    "wilaya_id": "16"
  },
  {
    "id": "579",
    "name": "Djasr Kasentina",
    "ar_name": "جسر قسنطينة",
    "wilaya_id": "16"
  },
  {
    "id": "580",
    "name": "El Mouradia",
    "ar_name": "المرادية",
    "wilaya_id": "16"
  },
  {
    "id": "581",
    "name": "Hydra",
    "ar_name": "حيدرة",
    "wilaya_id": "16"
  },
  {
    "id": "582",
    "name": "Mohammadia",
    "ar_name": "المحمدية",
    "wilaya_id": "16"
  },
  {
    "id": "583",
    "name": "Bordj El Kiffan",
    "ar_name": "برج الكيفان",
    "wilaya_id": "16"
  },
  {
    "id": "584",
    "name": "El Magharia",
    "ar_name": "المقرية",
    "wilaya_id": "16"
  },
  {
    "id": "585",
    "name": "Beni Messous",
    "ar_name": "بني مسوس",
    "wilaya_id": "16"
  },
  {
    "id": "586",
    "name": "Les Eucalyptus",
    "ar_name": "الكليتوس",
    "wilaya_id": "16"
  },
  {
    "id": "587",
    "name": "Birtouta",
    "ar_name": "بئر توتة",
    "wilaya_id": "16"
  },
  {
    "id": "588",
    "name": "Tassala El Merdja",
    "ar_name": "تسالة المرجة",
    "wilaya_id": "16"
  },
  {
    "id": "589",
    "name": "Ouled Chebel",
    "ar_name": "أولاد الشبل",
    "wilaya_id": "16"
  },
  {
    "id": "590",
    "name": "Sidi Moussa",
    "ar_name": "سيدي موسى",
    "wilaya_id": "16"
  },
  {
    "id": "591",
    "name": "Ain Taya",
    "ar_name": "عين طاية",
    "wilaya_id": "16"
  },
  {
    "id": "592",
    "name": "Bordj El Bahri",
    "ar_name": "برج البحري",
    "wilaya_id": "16"
  },
  {
    "id": "593",
    "name": "Marsa",
    "ar_name": "المرسى",
    "wilaya_id": "16"
  },
  {
    "id": "594",
    "name": "Haraoua",
    "ar_name": "هراوة",
    "wilaya_id": "16"
  },
  {
    "id": "595",
    "name": "Rouiba",
    "ar_name": "رويبة",
    "wilaya_id": "16"
  },
  {
    "id": "596",
    "name": "Reghaia",
    "ar_name": "الرغاية",
    "wilaya_id": "16"
  },
  {
    "id": "597",
    "name": "Ain Benian",
    "ar_name": "عين بنيان",
    "wilaya_id": "16"
  },
  {
    "id": "598",
    "name": "Staoueli",
    "ar_name": "سطاوالي",
    "wilaya_id": "16"
  },
  {
    "id": "599",
    "name": "Zeralda",
    "ar_name": "زرالدة",
    "wilaya_id": "16"
  },
  {
    "id": "600",
    "name": "Mahelma",
    "ar_name": "محالمة",
    "wilaya_id": "16"
  },
  {
    "id": "601",
    "name": "Rahmania",
    "ar_name": "رحمانية",
    "wilaya_id": "16"
  },
  {
    "id": "602",
    "name": "Souidania",
    "ar_name": "سويدانية",
    "wilaya_id": "16"
  },
  {
    "id": "603",
    "name": "Cheraga",
    "ar_name": "شراقة",
    "wilaya_id": "16"
  },
  {
    "id": "604",
    "name": "Ouled Fayet",
    "ar_name": "أولاد فايت",
    "wilaya_id": "16"
  },
  {
    "id": "605",
    "name": "El Achour",
    "ar_name": "العاشور",
    "wilaya_id": "16"
  },
  {
    "id": "606",
    "name": "Draria",
    "ar_name": "درارية",
    "wilaya_id": "16"
  },
  {
    "id": "607",
    "name": "Douera",
    "ar_name": "دويرة",
    "wilaya_id": "16"
  },
  {
    "id": "608",
    "name": "Baba Hassen",
    "ar_name": "بابا حسن",
    "wilaya_id": "16"
  },
  {
    "id": "609",
    "name": "Khracia",
    "ar_name": "خرايسية",
    "wilaya_id": "16"
  },
  {
    "id": "610",
    "name": "Saoula",
    "ar_name": "السحاولة",
    "wilaya_id": "16"
  },
  {
    "id": "611",
    "name": "Djelfa",
    "ar_name": "الجلفة",
    "wilaya_id": "17"
  },
  {
    "id": "612",
    "name": "Moudjebara",
    "ar_name": "مجبرة",
    "wilaya_id": "17"
  },
  {
    "id": "613",
    "name": "El Guedid",
    "ar_name": "القديد",
    "wilaya_id": "17"
  },
  {
    "id": "614",
    "name": "Hassi Bahbah",
    "ar_name": "حاسي بحبح",
    "wilaya_id": "17"
  },
  {
    "id": "615",
    "name": "Ain Maabed",
    "ar_name": "عين معبد",
    "wilaya_id": "17"
  },
  {
    "id": "616",
    "name": "Sed Rahal",
    "ar_name": "سد رحال",
    "wilaya_id": "66"
  },
  {
    "id": "617",
    "name": "Feidh El Botma",
    "ar_name": "فيض البطمة",
    "wilaya_id": "17"
  },
  {
    "id": "618",
    "name": "Birine",
    "ar_name": "البيرين",
    "wilaya_id": "65"
  },
  {
    "id": "619",
    "name": "Bouira Lahdeb",
    "ar_name": "بويرة الأحداب",
    "wilaya_id": "17"
  },
  {
    "id": "620",
    "name": "Zaccar",
    "ar_name": "زكار",
    "wilaya_id": "17"
  },
  {
    "id": "621",
    "name": "El Khemis",
    "ar_name": "الخميس",
    "wilaya_id": "17"
  },
  {
    "id": "622",
    "name": "Sidi Baizid",
    "ar_name": "سيدي بايزيد",
    "wilaya_id": "17"
  },
  {
    "id": "623",
    "name": "M'Liliha",
    "ar_name": "المليليحة",
    "wilaya_id": "17"
  },
  {
    "id": "624",
    "name": "El Idrissia",
    "ar_name": "الإدريسية",
    "wilaya_id": "17"
  },
  {
    "id": "625",
    "name": "Douis",
    "ar_name": "الدويس",
    "wilaya_id": "17"
  },
  {
    "id": "626",
    "name": "Hassi El Euch",
    "ar_name": "حاسي العش",
    "wilaya_id": "17"
  },
  {
    "id": "627",
    "name": "Messaad",
    "ar_name": "مسعد",
    "wilaya_id": "66"
  },
  {
    "id": "628",
    "name": "Guettara",
    "ar_name": "قتارة",
    "wilaya_id": "17"
  },
  {
    "id": "629",
    "name": "Sidi Ladjel",
    "ar_name": "سيدي لعجال",
    "wilaya_id": "65"
  },
  {
    "id": "630",
    "name": "Had Sahary",
    "ar_name": "حد الصحاري",
    "wilaya_id": "65"
  },
  {
    "id": "631",
    "name": "Guernini",
    "ar_name": "القرنيني",
    "wilaya_id": "65"
  },
  {
    "id": "632",
    "name": "Selmana",
    "ar_name": "سلمانة",
    "wilaya_id": "66"
  },
  {
    "id": "633",
    "name": "Ain Chouhada",
    "ar_name": "عين الشهداء",
    "wilaya_id": "17"
  },
  {
    "id": "634",
    "name": "Oum Laadham",
    "ar_name": "ام العظام",
    "wilaya_id": "17"
  },
  {
    "id": "635",
    "name": "Dar Chouikh",
    "ar_name": "دار الشيوخ",
    "wilaya_id": "17"
  },
  {
    "id": "636",
    "name": "Charef",
    "ar_name": "الشارف",
    "wilaya_id": "17"
  },
  {
    "id": "637",
    "name": "Beni Yacoub",
    "ar_name": "بن يعقوب",
    "wilaya_id": "17"
  },
  {
    "id": "638",
    "name": "Zaafrane",
    "ar_name": "الزعفران",
    "wilaya_id": "17"
  },
  {
    "id": "639",
    "name": "Deldoul",
    "ar_name": "دلدول",
    "wilaya_id": "66"
  },
  {
    "id": "640",
    "name": "Ain El Ibel",
    "ar_name": "عين الابل",
    "wilaya_id": "17"
  },
  {
    "id": "641",
    "name": "Ain Oussera",
    "ar_name": "عين وسارة",
    "wilaya_id": "65"
  },
  {
    "id": "642",
    "name": "Benhar",
    "ar_name": "بنهار",
    "wilaya_id": "65"
  },
  {
    "id": "643",
    "name": "Hassi Fedoul",
    "ar_name": "حاسي فدول",
    "wilaya_id": "65"
  },
  {
    "id": "644",
    "name": "Amourah",
    "ar_name": "عمورة",
    "wilaya_id": "17"
  },
  {
    "id": "645",
    "name": "Ain Fekka",
    "ar_name": "عين افقة",
    "wilaya_id": "65"
  },
  {
    "id": "646",
    "name": "Tadmit",
    "ar_name": "تعضميت",
    "wilaya_id": "17"
  },
  {
    "id": "647",
    "name": "Jijel",
    "ar_name": "جيجل",
    "wilaya_id": "18"
  },
  {
    "id": "648",
    "name": "Erraguene",
    "ar_name": "إراڨن",
    "wilaya_id": "18"
  },
  {
    "id": "649",
    "name": "El Aouana",
    "ar_name": "العوانة",
    "wilaya_id": "18"
  },
  {
    "id": "650",
    "name": "Ziamma Mansouriah",
    "ar_name": "زيامة منصورية",
    "wilaya_id": "18"
  },
  {
    "id": "651",
    "name": "Taher",
    "ar_name": "الطاهير",
    "wilaya_id": "18"
  },
  {
    "id": "652",
    "name": "Emir Abdelkader",
    "ar_name": "الامير عبد القادر",
    "wilaya_id": "18"
  },
  {
    "id": "653",
    "name": "Chekfa",
    "ar_name": "الشقفة",
    "wilaya_id": "18"
  },
  {
    "id": "654",
    "name": "Chahna",
    "ar_name": "الشحنة",
    "wilaya_id": "18"
  },
  {
    "id": "655",
    "name": "El Milia",
    "ar_name": "الميلية",
    "wilaya_id": "18"
  },
  {
    "id": "656",
    "name": "Sidi Maarouf",
    "ar_name": "سيدي معروف",
    "wilaya_id": "18"
  },
  {
    "id": "657",
    "name": "Settara",
    "ar_name": "السطارة",
    "wilaya_id": "18"
  },
  {
    "id": "658",
    "name": "El Ancer",
    "ar_name": "العنصر",
    "wilaya_id": "18"
  },
  {
    "id": "659",
    "name": "Sidi Abdelaziz",
    "ar_name": "سيدي عبد العزيز",
    "wilaya_id": "18"
  },
  {
    "id": "660",
    "name": "Kaous",
    "ar_name": "قاوس",
    "wilaya_id": "18"
  },
  {
    "id": "661",
    "name": "Ghebala",
    "ar_name": "غبالة",
    "wilaya_id": "18"
  },
  {
    "id": "662",
    "name": "Bouraoui Belhadef",
    "ar_name": "بوراوي بلهادف",
    "wilaya_id": "18"
  },
  {
    "id": "663",
    "name": "Djmila",
    "ar_name": "جيملة",
    "wilaya_id": "18"
  },
  {
    "id": "664",
    "name": "Selma Benziada",
    "ar_name": "سلمى بن زيادة",
    "wilaya_id": "18"
  },
  {
    "id": "665",
    "name": "Boussif Ouled Askeur",
    "ar_name": "أولاد عسكر",
    "wilaya_id": "18"
  },
  {
    "id": "666",
    "name": "El Kennar Nouchfi",
    "ar_name": "القنار",
    "wilaya_id": "18"
  },
  {
    "id": "667",
    "name": "Ouled Yahia Khadrouch",
    "ar_name": "اولاد يحيى",
    "wilaya_id": "18"
  },
  {
    "id": "668",
    "name": "Boudria Beni Yadjis",
    "ar_name": "بودريعة بن ياجيس",
    "wilaya_id": "18"
  },
  {
    "id": "669",
    "name": "Kemir Oued Adjoul",
    "ar_name": "بني بلعيد",
    "wilaya_id": "18"
  },
  {
    "id": "670",
    "name": "Texena",
    "ar_name": "تاكسنة",
    "wilaya_id": "18"
  },
  {
    "id": "671",
    "name": "Djemaa Beni Habibi",
    "ar_name": "الجمعة بني حبيبي",
    "wilaya_id": "18"
  },
  {
    "id": "672",
    "name": "Bordj T'her",
    "ar_name": "برج الطهر",
    "wilaya_id": "18"
  },
  {
    "id": "673",
    "name": "Ouled Rabah",
    "ar_name": "ولاد رابح",
    "wilaya_id": "18"
  },
  {
    "id": "674",
    "name": "Ouadjana",
    "ar_name": "وجانة",
    "wilaya_id": "18"
  },
  {
    "id": "675",
    "name": "Setif",
    "ar_name": "سطيف‎",
    "wilaya_id": "19"
  },
  {
    "id": "676",
    "name": "Ain El Kebira",
    "ar_name": "عين الكبيرة",
    "wilaya_id": "19"
  },
  {
    "id": "677",
    "name": "Beni Aziz",
    "ar_name": "بني عزيز",
    "wilaya_id": "19"
  },
  {
    "id": "678",
    "name": "Ouled Sidi Ahmed",
    "ar_name": "أولاد سي أحمد",
    "wilaya_id": "19"
  },
  {
    "id": "679",
    "name": "Boutaleb",
    "ar_name": "بوطالب",
    "wilaya_id": "19"
  },
  {
    "id": "680",
    "name": "Ain Roua",
    "ar_name": "عين الروى",
    "wilaya_id": "19"
  },
  {
    "id": "681",
    "name": "Draa Kebila",
    "ar_name": "ذراع قبيلة",
    "wilaya_id": "19"
  },
  {
    "id": "682",
    "name": "Bir El Arch",
    "ar_name": "بئر العرش",
    "wilaya_id": "19"
  },
  {
    "id": "683",
    "name": "Beni Chebana",
    "ar_name": "بني شبانة",
    "wilaya_id": "19"
  },
  {
    "id": "684",
    "name": "Ouled Tebben",
    "ar_name": "أولاد تبــان",
    "wilaya_id": "19"
  },
  {
    "id": "685",
    "name": "Hamma",
    "ar_name": "حــامة",
    "wilaya_id": "19"
  },
  {
    "id": "686",
    "name": "Maaouia",
    "ar_name": "معـاويـة",
    "wilaya_id": "19"
  },
  {
    "id": "687",
    "name": "Ain Legraj",
    "ar_name": "عين لڨراج",
    "wilaya_id": "19"
  },
  {
    "id": "688",
    "name": "Ain Abessa",
    "ar_name": "عين عباسـة",
    "wilaya_id": "19"
  },
  {
    "id": "689",
    "name": "Dehamcha",
    "ar_name": "الدهامشة",
    "wilaya_id": "19"
  },
  {
    "id": "690",
    "name": "Babor",
    "ar_name": "بابور",
    "wilaya_id": "19"
  },
  {
    "id": "691",
    "name": "Guidjel",
    "ar_name": "قجــال",
    "wilaya_id": "19"
  },
  {
    "id": "692",
    "name": "Ain Lahdjar",
    "ar_name": "عين لحجـر",
    "wilaya_id": "19"
  },
  {
    "id": "693",
    "name": "Bousselam",
    "ar_name": "بوسلام",
    "wilaya_id": "19"
  },
  {
    "id": "694",
    "name": "El Eulma",
    "ar_name": "العلمة",
    "wilaya_id": "19"
  },
  {
    "id": "695",
    "name": "Djemila",
    "ar_name": "جميلـة",
    "wilaya_id": "19"
  },
  {
    "id": "696",
    "name": "Beni Ouartilane",
    "ar_name": "بني ورتيلان",
    "wilaya_id": "19"
  },
  {
    "id": "697",
    "name": "Rosfa",
    "ar_name": "الرصفة",
    "wilaya_id": "19"
  },
  {
    "id": "698",
    "name": "Ouled Addouane",
    "ar_name": "أولاد عدوان",
    "wilaya_id": "19"
  },
  {
    "id": "699",
    "name": "Belaa",
    "ar_name": "البلاعة",
    "wilaya_id": "19"
  },
  {
    "id": "700",
    "name": "Ain Arnat",
    "ar_name": "عين أرنـات",
    "wilaya_id": "19"
  },
  {
    "id": "701",
    "name": "Amoucha",
    "ar_name": "عموشة",
    "wilaya_id": "19"
  },
  {
    "id": "702",
    "name": "Ain Oulmane",
    "ar_name": "عين ولمان",
    "wilaya_id": "19"
  },
  {
    "id": "703",
    "name": "Beidha Bordj",
    "ar_name": "بيضاء برج",
    "wilaya_id": "19"
  },
  {
    "id": "704",
    "name": "Bouandas",
    "ar_name": "بوعنداس",
    "wilaya_id": "19"
  },
  {
    "id": "705",
    "name": "Bazer Sakhra",
    "ar_name": "بازر الصخرة",
    "wilaya_id": "19"
  },
  {
    "id": "706",
    "name": "Hammam Essokhna",
    "ar_name": "حمــام السخنة",
    "wilaya_id": "19"
  },
  {
    "id": "707",
    "name": "Mezloug",
    "ar_name": "مزلوق",
    "wilaya_id": "19"
  },
  {
    "id": "708",
    "name": "Bir Haddada",
    "ar_name": "بئر حدادة",
    "wilaya_id": "19"
  },
  {
    "id": "709",
    "name": "Serdj El Ghoul",
    "ar_name": "سرج الغول",
    "wilaya_id": "19"
  },
  {
    "id": "710",
    "name": "Harbil",
    "ar_name": "حربيل",
    "wilaya_id": "19"
  },
  {
    "id": "711",
    "name": "El Ouricia",
    "ar_name": "الأورسية",
    "wilaya_id": "19"
  },
  {
    "id": "712",
    "name": "Tizi Nbechar",
    "ar_name": "تيزي نبشار",
    "wilaya_id": "19"
  },
  {
    "id": "713",
    "name": "Salah Bey",
    "ar_name": "صـالح باي",
    "wilaya_id": "19"
  },
  {
    "id": "714",
    "name": "Ain Azal",
    "ar_name": "عين أزال",
    "wilaya_id": "19"
  },
  {
    "id": "715",
    "name": "Guenzet",
    "ar_name": "ڨنزات",
    "wilaya_id": "19"
  },
  {
    "id": "716",
    "name": "Talaifacene",
    "ar_name": "تالة إيفاسن",
    "wilaya_id": "19"
  },
  {
    "id": "717",
    "name": "Bougaa",
    "ar_name": "بوقاعـة",
    "wilaya_id": "19"
  },
  {
    "id": "718",
    "name": "Beni Fouda",
    "ar_name": "بني فودة",
    "wilaya_id": "19"
  },
  {
    "id": "719",
    "name": "Tachouda",
    "ar_name": "تاشودة",
    "wilaya_id": "19"
  },
  {
    "id": "720",
    "name": "Beni Mouhli",
    "ar_name": "إيث موحلي",
    "wilaya_id": "19"
  },
  {
    "id": "721",
    "name": "Ouled Sabor",
    "ar_name": "أولاد صـابر",
    "wilaya_id": "19"
  },
  {
    "id": "722",
    "name": "Guellal",
    "ar_name": "قلال",
    "wilaya_id": "19"
  },
  {
    "id": "723",
    "name": "Ain Sebt",
    "ar_name": "عين السبت",
    "wilaya_id": "19"
  },
  {
    "id": "724",
    "name": "Hammam Guergour",
    "ar_name": "حمام قرقور",
    "wilaya_id": "19"
  },
  {
    "id": "725",
    "name": "Ait Naoual Mezada",
    "ar_name": "آيت نوال مزادة",
    "wilaya_id": "19"
  },
  {
    "id": "726",
    "name": "Ksar El Abtal",
    "ar_name": "قصرالأبطال",
    "wilaya_id": "19"
  },
  {
    "id": "727",
    "name": "Beni Hocine",
    "ar_name": "بني حسين",
    "wilaya_id": "19"
  },
  {
    "id": "728",
    "name": "Ait Tizi",
    "ar_name": "آيت تيزي",
    "wilaya_id": "19"
  },
  {
    "id": "729",
    "name": "Maouklane",
    "ar_name": "موكلان",
    "wilaya_id": "19"
  },
  {
    "id": "730",
    "name": "Guelta Zerka",
    "ar_name": "القلتة الزرقاء",
    "wilaya_id": "19"
  },
  {
    "id": "731",
    "name": "Oued El Barad",
    "ar_name": "واد البارد",
    "wilaya_id": "19"
  },
  {
    "id": "732",
    "name": "Taya",
    "ar_name": "طاية",
    "wilaya_id": "19"
  },
  {
    "id": "733",
    "name": "El Ouldja",
    "ar_name": "الولجـة",
    "wilaya_id": "19"
  },
  {
    "id": "734",
    "name": "Tella",
    "ar_name": "التلة",
    "wilaya_id": "19"
  },
  {
    "id": "735",
    "name": "Saida",
    "ar_name": "سعيدة",
    "wilaya_id": "20"
  },
  {
    "id": "736",
    "name": "Doui Thabet",
    "ar_name": "دوى ثابت",
    "wilaya_id": "20"
  },
  {
    "id": "737",
    "name": "Ain El Hadjar",
    "ar_name": "عين الحجر",
    "wilaya_id": "20"
  },
  {
    "id": "738",
    "name": "Ouled Khaled",
    "ar_name": "أولاد خالد",
    "wilaya_id": "20"
  },
  {
    "id": "739",
    "name": "Moulay Larbi",
    "ar_name": "موالي العربي",
    "wilaya_id": "20"
  },
  {
    "id": "740",
    "name": "Youb",
    "ar_name": "يوب",
    "wilaya_id": "20"
  },
  {
    "id": "741",
    "name": "Hounet",
    "ar_name": "هونت",
    "wilaya_id": "20"
  },
  {
    "id": "742",
    "name": "Sidi Amar",
    "ar_name": "يدي عمر",
    "wilaya_id": "20"
  },
  {
    "id": "743",
    "name": "Sidi Boubekeur",
    "ar_name": "سيدي بوبكر",
    "wilaya_id": "20"
  },
  {
    "id": "744",
    "name": "El Hassasna",
    "ar_name": "حساسنة",
    "wilaya_id": "20"
  },
  {
    "id": "745",
    "name": "Maamora",
    "ar_name": "معمورة",
    "wilaya_id": "20"
  },
  {
    "id": "746",
    "name": "Sidi Ahmed",
    "ar_name": "سيدي أحمد",
    "wilaya_id": "20"
  },
  {
    "id": "747",
    "name": "Ain Sekhouna",
    "ar_name": "العين السخونة",
    "wilaya_id": "20"
  },
  {
    "id": "748",
    "name": "Ouled Brahim",
    "ar_name": "أولاد ابراھيم",
    "wilaya_id": "20"
  },
  {
    "id": "749",
    "name": "Tircine",
    "ar_name": "تيرسين",
    "wilaya_id": "20"
  },
  {
    "id": "750",
    "name": "Ain Soltane",
    "ar_name": "عين السلطان",
    "wilaya_id": "20"
  },
  {
    "id": "751",
    "name": "Skikda",
    "ar_name": "سكيكدة",
    "wilaya_id": "21"
  },
  {
    "id": "752",
    "name": "Ain Zouit",
    "ar_name": "عين زويت",
    "wilaya_id": "21"
  },
  {
    "id": "753",
    "name": "El Hadaik",
    "ar_name": "الحدايق",
    "wilaya_id": "21"
  },
  {
    "id": "754",
    "name": "Azzaba",
    "ar_name": "عزابة",
    "wilaya_id": "21"
  },
  {
    "id": "755",
    "name": "Djendel",
    "ar_name": "جندل",
    "wilaya_id": "21"
  },
  {
    "id": "756",
    "name": "Ain Cherchar",
    "ar_name": "عين شرشار",
    "wilaya_id": "21"
  },
  {
    "id": "757",
    "name": "Bekkouche Lakhdar",
    "ar_name": "بكوش لخضر",
    "wilaya_id": "21"
  },
  {
    "id": "758",
    "name": "Ben Azzouz",
    "ar_name": "بن عزوز",
    "wilaya_id": "21"
  },
  {
    "id": "759",
    "name": "Es Sebt",
    "ar_name": "السبت",
    "wilaya_id": "21"
  },
  {
    "id": "760",
    "name": "Collo",
    "ar_name": "القل",
    "wilaya_id": "21"
  },
  {
    "id": "761",
    "name": "Beni Zid",
    "ar_name": "بنى زيد",
    "wilaya_id": "21"
  },
  {
    "id": "762",
    "name": "Kerkera",
    "ar_name": "كركرة",
    "wilaya_id": "21"
  },
  {
    "id": "763",
    "name": "Ouled Attia",
    "ar_name": "أولاد عطية",
    "wilaya_id": "21"
  },
  {
    "id": "764",
    "name": "Oued Zehour",
    "ar_name": "وادي الزهور",
    "wilaya_id": "21"
  },
  {
    "id": "765",
    "name": "Zitouna",
    "ar_name": "الزيتونة",
    "wilaya_id": "21"
  },
  {
    "id": "766",
    "name": "El Harrouch",
    "ar_name": "الحروش",
    "wilaya_id": "21"
  },
  {
    "id": "767",
    "name": "Zerdazas",
    "ar_name": "زردازة",
    "wilaya_id": "21"
  },
  {
    "id": "768",
    "name": "Ouled Hebaba",
    "ar_name": "أولاد حبابة",
    "wilaya_id": "21"
  },
  {
    "id": "769",
    "name": "Sidi Mezghiche",
    "ar_name": "سيدي مزغيش",
    "wilaya_id": "21"
  },
  {
    "id": "770",
    "name": "Emdjez Edchich",
    "ar_name": "مجاز الدشيش",
    "wilaya_id": "21"
  },
  {
    "id": "771",
    "name": "Beni Oulbane",
    "ar_name": "بني والبان",
    "wilaya_id": "21"
  },
  {
    "id": "772",
    "name": "Ain Bouziane",
    "ar_name": "عين بوزيان",
    "wilaya_id": "21"
  },
  {
    "id": "773",
    "name": "Ramdane Djamel",
    "ar_name": "رمضان جمال",
    "wilaya_id": "21"
  },
  {
    "id": "774",
    "name": "Beni Bachir",
    "ar_name": "بني بشير",
    "wilaya_id": "21"
  },
  {
    "id": "775",
    "name": "Salah Bouchaour",
    "ar_name": "صالح بوالشعور",
    "wilaya_id": "21"
  },
  {
    "id": "776",
    "name": "Tamalous",
    "ar_name": "تمالوس",
    "wilaya_id": "21"
  },
  {
    "id": "777",
    "name": "Ain Kechra",
    "ar_name": "عين قشرة",
    "wilaya_id": "21"
  },
  {
    "id": "778",
    "name": "Oum Toub",
    "ar_name": "أم الطوب",
    "wilaya_id": "21"
  },
  {
    "id": "779",
    "name": "Bein El Ouiden",
    "ar_name": "بين الويدان",
    "wilaya_id": "21"
  },
  {
    "id": "780",
    "name": "Filfila",
    "ar_name": "فلفلة",
    "wilaya_id": "21"
  },
  {
    "id": "781",
    "name": "Cheraia",
    "ar_name": "الشرايع",
    "wilaya_id": "21"
  },
  {
    "id": "782",
    "name": "Kanoua",
    "ar_name": "قنواع",
    "wilaya_id": "21"
  },
  {
    "id": "783",
    "name": "El Ghedir",
    "ar_name": "الغدير",
    "wilaya_id": "21"
  },
  {
    "id": "784",
    "name": "Bouchtata",
    "ar_name": "بوشطاطة",
    "wilaya_id": "21"
  },
  {
    "id": "785",
    "name": "Ouldja Boulbalout",
    "ar_name": "الولجة بو البلوط",
    "wilaya_id": "21"
  },
  {
    "id": "786",
    "name": "Kheneg Mayoum",
    "ar_name": "خنق مايوم",
    "wilaya_id": "21"
  },
  {
    "id": "787",
    "name": "Hamadi Krouma",
    "ar_name": "حمادي كرومة",
    "wilaya_id": "21"
  },
  {
    "id": "788",
    "name": "El Marsa",
    "ar_name": "المرسى",
    "wilaya_id": "21"
  },
  {
    "id": "789",
    "name": "Sidi Bel Abbes",
    "ar_name": "سيدي بلعباس",
    "wilaya_id": "22"
  },
  {
    "id": "790",
    "name": "Tessala",
    "ar_name": "تسالة",
    "wilaya_id": "22"
  },
  {
    "id": "791",
    "name": "Sidi Brahim",
    "ar_name": "سيدي ابراهيم",
    "wilaya_id": "22"
  },
  {
    "id": "792",
    "name": "Mostefa Ben Brahim",
    "ar_name": "مصطفى بن ابراهيم",
    "wilaya_id": "22"
  },
  {
    "id": "793",
    "name": "Telagh",
    "ar_name": "تلاغ",
    "wilaya_id": "22"
  },
  {
    "id": "794",
    "name": "Mezaourou",
    "ar_name": "مزاورو",
    "wilaya_id": "22"
  },
  {
    "id": "795",
    "name": "Boukhanafis",
    "ar_name": "بوخنفيس",
    "wilaya_id": "22"
  },
  {
    "id": "796",
    "name": "Sidi Ali Boussidi",
    "ar_name": "سيدي علي بوسيدي",
    "wilaya_id": "22"
  },
  {
    "id": "797",
    "name": "Badredine El Mokrani",
    "ar_name": "بدر الدين المقراني",
    "wilaya_id": "22"
  },
  {
    "id": "798",
    "name": "Marhoum",
    "ar_name": "مرحوم",
    "wilaya_id": "22"
  },
  {
    "id": "799",
    "name": "Tafissour",
    "ar_name": "تفسور",
    "wilaya_id": "22"
  },
  {
    "id": "800",
    "name": "Amarnas",
    "ar_name": "العمارنة",
    "wilaya_id": "22"
  },
  {
    "id": "801",
    "name": "Tilmouni",
    "ar_name": "تلموني",
    "wilaya_id": "22"
  },
  {
    "id": "802",
    "name": "Sidi Lahcene",
    "ar_name": "سيدي لحسن",
    "wilaya_id": "22"
  },
  {
    "id": "803",
    "name": "Ain Thrid",
    "ar_name": "عين التريد",
    "wilaya_id": "22"
  },
  {
    "id": "804",
    "name": "Makedra",
    "ar_name": "مكدرة",
    "wilaya_id": "22"
  },
  {
    "id": "805",
    "name": "Tenira",
    "ar_name": "تنيرة",
    "wilaya_id": "22"
  },
  {
    "id": "806",
    "name": "Moulay Slissen",
    "ar_name": "مولاي سليسن",
    "wilaya_id": "22"
  },
  {
    "id": "807",
    "name": "El Hacaiba",
    "ar_name": "الحصيبة",
    "wilaya_id": "22"
  },
  {
    "id": "808",
    "name": "Hassi Zehana",
    "ar_name": "حاسي زهانة",
    "wilaya_id": "22"
  },
  {
    "id": "809",
    "name": "Tabia",
    "ar_name": "طابية",
    "wilaya_id": "22"
  },
  {
    "id": "810",
    "name": "Merine",
    "ar_name": "مرين",
    "wilaya_id": "22"
  },
  {
    "id": "811",
    "name": "Ras El Ma",
    "ar_name": "رأس الماء",
    "wilaya_id": "22"
  },
  {
    "id": "812",
    "name": "Ain Tindamine",
    "ar_name": "عين تندامين",
    "wilaya_id": "22"
  },
  {
    "id": "813",
    "name": "Ain Kada",
    "ar_name": "عين قادة",
    "wilaya_id": "22"
  },
  {
    "id": "814",
    "name": "Mcid",
    "ar_name": "مسيد",
    "wilaya_id": "22"
  },
  {
    "id": "815",
    "name": "Sidi Khaled",
    "ar_name": "سيدي خالد",
    "wilaya_id": "22"
  },
  {
    "id": "816",
    "name": "Ain El Berd",
    "ar_name": "عين البرد",
    "wilaya_id": "22"
  },
  {
    "id": "817",
    "name": "Sfissef",
    "ar_name": "سفيزف",
    "wilaya_id": "22"
  },
  {
    "id": "818",
    "name": "Ain Adden",
    "ar_name": "عين عدان",
    "wilaya_id": "22"
  },
  {
    "id": "819",
    "name": "Oued Taourira",
    "ar_name": "واد تاوريرة",
    "wilaya_id": "22"
  },
  {
    "id": "820",
    "name": "Dhaya",
    "ar_name": "الظاية",
    "wilaya_id": "22"
  },
  {
    "id": "821",
    "name": "Zerouala",
    "ar_name": "زروالة",
    "wilaya_id": "22"
  },
  {
    "id": "822",
    "name": "Lamtar",
    "ar_name": "لمطار",
    "wilaya_id": "22"
  },
  {
    "id": "823",
    "name": "Sidi Chaib",
    "ar_name": "سيدي شعيب",
    "wilaya_id": "22"
  },
  {
    "id": "824",
    "name": "Sidi Dahou",
    "ar_name": "سيدي دحو",
    "wilaya_id": "22"
  },
  {
    "id": "825",
    "name": "Oued Sbaa",
    "ar_name": "واد السبع",
    "wilaya_id": "22"
  },
  {
    "id": "826",
    "name": "Boudjebaa El Bordj",
    "ar_name": "بوجبهة البرج",
    "wilaya_id": "22"
  },
  {
    "id": "827",
    "name": "Sehala Thaoura",
    "ar_name": "سهالة الثورة",
    "wilaya_id": "22"
  },
  {
    "id": "828",
    "name": "Sidi Yacoub",
    "ar_name": "سيدي يعقوب",
    "wilaya_id": "22"
  },
  {
    "id": "829",
    "name": "Sidi Hamadouche",
    "ar_name": "سيدي حمادوش",
    "wilaya_id": "22"
  },
  {
    "id": "830",
    "name": "Belarbi",
    "ar_name": "بلعربي",
    "wilaya_id": "22"
  },
  {
    "id": "831",
    "name": "Oued Sefioun",
    "ar_name": "واد سفيون",
    "wilaya_id": "22"
  },
  {
    "id": "832",
    "name": "Teghalimet",
    "ar_name": "تغاليمت",
    "wilaya_id": "22"
  },
  {
    "id": "833",
    "name": "Ben Badis",
    "ar_name": "ابن باديس",
    "wilaya_id": "22"
  },
  {
    "id": "834",
    "name": "Sidi Ali Benyoub",
    "ar_name": "سيدي علي بن يوب",
    "wilaya_id": "22"
  },
  {
    "id": "835",
    "name": "Chetouane Belaila",
    "ar_name": "شطوان بلايلة",
    "wilaya_id": "22"
  },
  {
    "id": "836",
    "name": "Bir El Hammam",
    "ar_name": "بئر الحمام",
    "wilaya_id": "22"
  },
  {
    "id": "837",
    "name": "Taoudmout",
    "ar_name": "تاودموت",
    "wilaya_id": "22"
  },
  {
    "id": "838",
    "name": "Redjem Demouche",
    "ar_name": "رجم دموش",
    "wilaya_id": "22"
  },
  {
    "id": "839",
    "name": "Benachiba Chelia",
    "ar_name": "بن عشيبة شلية",
    "wilaya_id": "22"
  },
  {
    "id": "840",
    "name": "Hassi Dahou",
    "ar_name": "حاسي دحو",
    "wilaya_id": "22"
  },
  {
    "id": "841",
    "name": "Annaba",
    "ar_name": "عنابة",
    "wilaya_id": "23"
  },
  {
    "id": "842",
    "name": "Berrahel",
    "ar_name": "برحال",
    "wilaya_id": "23"
  },
  {
    "id": "843",
    "name": "El Hadjar",
    "ar_name": "الحجار",
    "wilaya_id": "23"
  },
  {
    "id": "844",
    "name": "Eulma",
    "ar_name": "العلمة",
    "wilaya_id": "23"
  },
  {
    "id": "845",
    "name": "El Bouni",
    "ar_name": "البوني",
    "wilaya_id": "23"
  },
  {
    "id": "846",
    "name": "Oued El Aneb",
    "ar_name": "وادي العنب",
    "wilaya_id": "23"
  },
  {
    "id": "847",
    "name": "Cheurfa",
    "ar_name": "الشرفة",
    "wilaya_id": "23"
  },
  {
    "id": "848",
    "name": "Seraidi",
    "ar_name": "سرايدي",
    "wilaya_id": "23"
  },
  {
    "id": "849",
    "name": "Ain Berda",
    "ar_name": "عين الباردة",
    "wilaya_id": "23"
  },
  {
    "id": "850",
    "name": "Chetaibi",
    "ar_name": "شطايبي",
    "wilaya_id": "23"
  },
  {
    "id": "851",
    "name": "Sidi Amer",
    "ar_name": "سيدي عمار",
    "wilaya_id": "23"
  },
  {
    "id": "852",
    "name": "Treat",
    "ar_name": "التريعات",
    "wilaya_id": "23"
  },
  {
    "id": "853",
    "name": "Guelma",
    "ar_name": "قالمة",
    "wilaya_id": "24"
  },
  {
    "id": "854",
    "name": "Nechmaya",
    "ar_name": "نشماية",
    "wilaya_id": "24"
  },
  {
    "id": "855",
    "name": "Bouati Mahmoud",
    "ar_name": "بوعاتي محمود",
    "wilaya_id": "24"
  },
  {
    "id": "856",
    "name": "Oued Zenati",
    "ar_name": "وادي الزناتي",
    "wilaya_id": "24"
  },
  {
    "id": "857",
    "name": "Tamlouka",
    "ar_name": "تاملوكة",
    "wilaya_id": "24"
  },
  {
    "id": "858",
    "name": "Oued Fragha",
    "ar_name": "وادي فراغة",
    "wilaya_id": "24"
  },
  {
    "id": "859",
    "name": "Ain Sandel",
    "ar_name": "عين صندل",
    "wilaya_id": "24"
  },
  {
    "id": "860",
    "name": "Ras El Agba",
    "ar_name": "راس العقبة",
    "wilaya_id": "24"
  },
  {
    "id": "861",
    "name": "Dahouara",
    "ar_name": "الدهوارة",
    "wilaya_id": "24"
  },
  {
    "id": "862",
    "name": "Belkhir",
    "ar_name": "بلخير",
    "wilaya_id": "24"
  },
  {
    "id": "863",
    "name": "Ben Djarah",
    "ar_name": "بن جراح",
    "wilaya_id": "24"
  },
  {
    "id": "864",
    "name": "Bou Hamdane",
    "ar_name": "بوحمدان",
    "wilaya_id": "24"
  },
  {
    "id": "865",
    "name": "Ain Makhlouf",
    "ar_name": "عين مخلوف",
    "wilaya_id": "24"
  },
  {
    "id": "866",
    "name": "Ain Ben Beida",
    "ar_name": "عين بن بيضاء",
    "wilaya_id": "24"
  },
  {
    "id": "867",
    "name": "Khezara",
    "ar_name": "خزارة",
    "wilaya_id": "24"
  },
  {
    "id": "868",
    "name": "Beni Mezline",
    "ar_name": "بني مزلين",
    "wilaya_id": "24"
  },
  {
    "id": "869",
    "name": "Bou Hachana",
    "ar_name": "بوحشانة",
    "wilaya_id": "24"
  },
  {
    "id": "870",
    "name": "Guelaat Bou Sbaa",
    "ar_name": "قلعة بوصبع",
    "wilaya_id": "24"
  },
  {
    "id": "871",
    "name": "Hammam Maskhoutine",
    "ar_name": "حمام مسخوطين",
    "wilaya_id": "24"
  },
  {
    "id": "872",
    "name": "El Fedjoudj",
    "ar_name": "الفجوج",
    "wilaya_id": "24"
  },
  {
    "id": "873",
    "name": "Bordj Sabat",
    "ar_name": "برج صباط",
    "wilaya_id": "24"
  },
  {
    "id": "874",
    "name": "Hamman Nbail",
    "ar_name": "حمام النبايل",
    "wilaya_id": "24"
  },
  {
    "id": "875",
    "name": "Ain Larbi",
    "ar_name": "عين العربى",
    "wilaya_id": "24"
  },
  {
    "id": "876",
    "name": "Medjez Amar",
    "ar_name": "مجاز عمار",
    "wilaya_id": "24"
  },
  {
    "id": "877",
    "name": "Bouchegouf",
    "ar_name": "بوشقوف",
    "wilaya_id": "24"
  },
  {
    "id": "878",
    "name": "Heliopolis",
    "ar_name": "ھيليوبوليس",
    "wilaya_id": "24"
  },
  {
    "id": "879",
    "name": "Houari Boumediene",
    "ar_name": "هواري بومدين",
    "wilaya_id": "24"
  },
  {
    "id": "880",
    "name": "Roknia",
    "ar_name": "الركنية",
    "wilaya_id": "24"
  },
  {
    "id": "881",
    "name": "Salaoua Announa",
    "ar_name": "سلاوة عنونة",
    "wilaya_id": "24"
  },
  {
    "id": "882",
    "name": "Medjez Sfa",
    "ar_name": "مجاز الصفاء",
    "wilaya_id": "24"
  },
  {
    "id": "883",
    "name": "Boumahra Ahmed",
    "ar_name": "بومهرة أحمد",
    "wilaya_id": "24"
  },
  {
    "id": "884",
    "name": "Ain Reggada",
    "ar_name": "عين رقادة",
    "wilaya_id": "24"
  },
  {
    "id": "885",
    "name": "Oued Cheham",
    "ar_name": "وادي الشحم",
    "wilaya_id": "24"
  },
  {
    "id": "886",
    "name": "Djeballah Khemissi",
    "ar_name": "جبالة لخميسي",
    "wilaya_id": "24"
  },
  {
    "id": "887",
    "name": "Constantine",
    "ar_name": "قسنطينة",
    "wilaya_id": "25"
  },
  {
    "id": "888",
    "name": "Hamma Bouziane",
    "ar_name": "حامة بوزيان",
    "wilaya_id": "25"
  },
  {
    "id": "889",
    "name": "Ibn Badis",
    "ar_name": "إبن باديس",
    "wilaya_id": "25"
  },
  {
    "id": "890",
    "name": "Zighoud Youcef",
    "ar_name": "زيغود يوسف",
    "wilaya_id": "25"
  },
  {
    "id": "891",
    "name": "Didouche Mourad",
    "ar_name": "ديدوش مراد",
    "wilaya_id": "25"
  },
  {
    "id": "892",
    "name": "El Khroub",
    "ar_name": "الخروب",
    "wilaya_id": "25"
  },
  {
    "id": "893",
    "name": "Ain Abid",
    "ar_name": "عين عبيد",
    "wilaya_id": "25"
  },
  {
    "id": "894",
    "name": "Beni Hamiden",
    "ar_name": "بني حميدان",
    "wilaya_id": "25"
  },
  {
    "id": "895",
    "name": "Ouled Rahmoune",
    "ar_name": "أولاد رحمون",
    "wilaya_id": "25"
  },
  {
    "id": "896",
    "name": "Ain Smara",
    "ar_name": "عين سمارة",
    "wilaya_id": "25"
  },
  {
    "id": "897",
    "name": "Mesaoud Boudjeriou",
    "ar_name": "مسعود بوجريو",
    "wilaya_id": "25"
  },
  {
    "id": "898",
    "name": "Ibn Ziad",
    "ar_name": "ابن زياد",
    "wilaya_id": "25"
  },
  {
    "id": "899",
    "name": "Medea",
    "ar_name": "المدية",
    "wilaya_id": "26"
  },
  {
    "id": "900",
    "name": "Ouzera",
    "ar_name": "وزرة",
    "wilaya_id": "26"
  },
  {
    "id": "901",
    "name": "Ouled Maaref",
    "ar_name": "أولاد معرف",
    "wilaya_id": "26"
  },
  {
    "id": "902",
    "name": "Ain Boucif",
    "ar_name": "عين بوسيف",
    "wilaya_id": "26"
  },
  {
    "id": "903",
    "name": "Aissaouia",
    "ar_name": "العيساوية",
    "wilaya_id": "26"
  },
  {
    "id": "904",
    "name": "Ouled Deide",
    "ar_name": "أولاد دايد",
    "wilaya_id": "26"
  },
  {
    "id": "905",
    "name": "El Omaria",
    "ar_name": "العمارية",
    "wilaya_id": "67"
  },
  {
    "id": "906",
    "name": "Derrag",
    "ar_name": "دراڨ",
    "wilaya_id": "26"
  },
  {
    "id": "907",
    "name": "El Guelbelkebir",
    "ar_name": "القلب الكبير",
    "wilaya_id": "26"
  },
  {
    "id": "908",
    "name": "Bouaiche",
    "ar_name": "بوعيش",
    "wilaya_id": "26"
  },
  {
    "id": "909",
    "name": "Mezerena",
    "ar_name": "مزغنة",
    "wilaya_id": "26"
  },
  {
    "id": "910",
    "name": "Ouled Brahim",
    "ar_name": "أولاد إبراهيم",
    "wilaya_id": "26"
  },
  {
    "id": "911",
    "name": "Tizi Mahdi",
    "ar_name": "تيزي المهدي",
    "wilaya_id": "26"
  },
  {
    "id": "912",
    "name": "Sidi Ziane",
    "ar_name": "سيدي زيان",
    "wilaya_id": "26"
  },
  {
    "id": "913",
    "name": "Tamesguida",
    "ar_name": "تمزڨيدة",
    "wilaya_id": "26"
  },
  {
    "id": "914",
    "name": "El Hamdania",
    "ar_name": "الحمدانية",
    "wilaya_id": "26"
  },
  {
    "id": "915",
    "name": "Kef Lakhdar",
    "ar_name": "الكاف الأخضر",
    "wilaya_id": "26"
  },
  {
    "id": "916",
    "name": "Chelalet El Adhaoura",
    "ar_name": "شلالة العذاورة",
    "wilaya_id": "26"
  },
  {
    "id": "917",
    "name": "Bouskene",
    "ar_name": "بوسكن",
    "wilaya_id": "26"
  },
  {
    "id": "918",
    "name": "Rebaia",
    "ar_name": "الربعية",
    "wilaya_id": "26"
  },
  {
    "id": "919",
    "name": "Bouchrahil",
    "ar_name": "بوشراحيل",
    "wilaya_id": "26"
  },
  {
    "id": "920",
    "name": "Ouled Hellal",
    "ar_name": "أولاد هلال",
    "wilaya_id": "26"
  },
  {
    "id": "921",
    "name": "Tafraout",
    "ar_name": "تافراوت",
    "wilaya_id": "26"
  },
  {
    "id": "922",
    "name": "Baata",
    "ar_name": "بعطة",
    "wilaya_id": "26"
  },
  {
    "id": "923",
    "name": "Boghar",
    "ar_name": "بوغار",
    "wilaya_id": "26"
  },
  {
    "id": "924",
    "name": "Sidi Naamane",
    "ar_name": "سيدي نعمان",
    "wilaya_id": "26"
  },
  {
    "id": "925",
    "name": "Ouled Bouachra",
    "ar_name": "أولاد بوعشرة",
    "wilaya_id": "26"
  },
  {
    "id": "926",
    "name": "Sidi Zahar",
    "ar_name": "سيدي زهار",
    "wilaya_id": "26"
  },
  {
    "id": "927",
    "name": "Oued Harbil",
    "ar_name": "وادي حربيل",
    "wilaya_id": "26"
  },
  {
    "id": "928",
    "name": "Benchicao",
    "ar_name": "بن شكاو",
    "wilaya_id": "26"
  },
  {
    "id": "929",
    "name": "Sidi Damed",
    "ar_name": "سيدي دامد",
    "wilaya_id": "26"
  },
  {
    "id": "930",
    "name": "Aziz",
    "ar_name": "عزيز",
    "wilaya_id": "67"
  },
  {
    "id": "931",
    "name": "Souagui",
    "ar_name": "السواڨي",
    "wilaya_id": "26"
  },
  {
    "id": "932",
    "name": "Zoubiria",
    "ar_name": "الزبيرية",
    "wilaya_id": "26"
  },
  {
    "id": "933",
    "name": "Ksar El Boukhari",
    "ar_name": "قصر البخاري",
    "wilaya_id": "67"
  },
  {
    "id": "934",
    "name": "El Azizia",
    "ar_name": "العزيزية",
    "wilaya_id": "26"
  },
  {
    "id": "935",
    "name": "Djouab",
    "ar_name": "جواب",
    "wilaya_id": "26"
  },
  {
    "id": "936",
    "name": "Chahbounia",
    "ar_name": "الشهبونية",
    "wilaya_id": "67"
  },
  {
    "id": "937",
    "name": "Meghraoua",
    "ar_name": "مغراوة",
    "wilaya_id": "26"
  },
  {
    "id": "938",
    "name": "Cheniguel",
    "ar_name": "شنيڨل",
    "wilaya_id": "26"
  },
  {
    "id": "939",
    "name": "Ain Ouksir",
    "ar_name": "عين القصير",
    "wilaya_id": "26"
  },
  {
    "id": "940",
    "name": "Oum El Djalil",
    "ar_name": "أم الجليل",
    "wilaya_id": "26"
  },
  {
    "id": "941",
    "name": "Ouamri",
    "ar_name": "عوامري",
    "wilaya_id": "26"
  },
  {
    "id": "942",
    "name": "Si Mahdjoub",
    "ar_name": "سى المحجوب",
    "wilaya_id": "26"
  },
  {
    "id": "943",
    "name": "Tlatet Eddouair",
    "ar_name": "ثلاثة الدوائر",
    "wilaya_id": "26"
  },
  {
    "id": "944",
    "name": "Beni Slimane",
    "ar_name": "بني سليمان",
    "wilaya_id": "26"
  },
  {
    "id": "945",
    "name": "Berrouaghia",
    "ar_name": "البرواڨية",
    "wilaya_id": "26"
  },
  {
    "id": "946",
    "name": "Seghouane",
    "ar_name": "سغوان",
    "wilaya_id": "26"
  },
  {
    "id": "947",
    "name": "Meftaha",
    "ar_name": "المفاتحة",
    "wilaya_id": "26"
  },
  {
    "id": "948",
    "name": "Mihoub",
    "ar_name": "ميهوب",
    "wilaya_id": "26"
  },
  {
    "id": "949",
    "name": "Boughezoul",
    "ar_name": "بوغزول",
    "wilaya_id": "26"
  },
  {
    "id": "950",
    "name": "Tablat",
    "ar_name": "تابلاط",
    "wilaya_id": "26"
  },
  {
    "id": "951",
    "name": "Deux Bassins",
    "ar_name": "فج الحوضين",
    "wilaya_id": "26"
  },
  {
    "id": "952",
    "name": "Draa Essamar",
    "ar_name": "ذراع السمار",
    "wilaya_id": "26"
  },
  {
    "id": "953",
    "name": "Sidi Errabia",
    "ar_name": "سيدي الربيع",
    "wilaya_id": "26"
  },
  {
    "id": "954",
    "name": "Bir Ben Laabed",
    "ar_name": "بئر بن العابد",
    "wilaya_id": "26"
  },
  {
    "id": "955",
    "name": "El Ouinet",
    "ar_name": "العوينات",
    "wilaya_id": "26"
  },
  {
    "id": "956",
    "name": "Ouled Antar",
    "ar_name": "أولاد عنتر",
    "wilaya_id": "67"
  },
  {
    "id": "957",
    "name": "Bouaichoune",
    "ar_name": "بوعيشون",
    "wilaya_id": "26"
  },
  {
    "id": "958",
    "name": "Hannacha",
    "ar_name": "حناشة",
    "wilaya_id": "26"
  },
  {
    "id": "959",
    "name": "Sedraia",
    "ar_name": "سدراية",
    "wilaya_id": "26"
  },
  {
    "id": "960",
    "name": "Medjebar",
    "ar_name": "مجبر",
    "wilaya_id": "26"
  },
  {
    "id": "961",
    "name": "Khams Djouamaa",
    "ar_name": "خمس جوامع",
    "wilaya_id": "26"
  },
  {
    "id": "962",
    "name": "Saneg",
    "ar_name": "سانڨ",
    "wilaya_id": "67"
  },
  {
    "id": "963",
    "name": "Mostaganem",
    "ar_name": "مستغانم",
    "wilaya_id": "27"
  },
  {
    "id": "964",
    "name": "Sayada",
    "ar_name": "صيادة",
    "wilaya_id": "27"
  },
  {
    "id": "965",
    "name": "Fornaka",
    "ar_name": "فرناكة",
    "wilaya_id": "27"
  },
  {
    "id": "966",
    "name": "Stidia",
    "ar_name": "ستيدية",
    "wilaya_id": "27"
  },
  {
    "id": "967",
    "name": "Ain Nouissy",
    "ar_name": "عين نويسي",
    "wilaya_id": "27"
  },
  {
    "id": "968",
    "name": "Hassi Maameche",
    "ar_name": "حاسي مماش",
    "wilaya_id": "27"
  },
  {
    "id": "969",
    "name": "Ain Tadles",
    "ar_name": "عين تادلس",
    "wilaya_id": "27"
  },
  {
    "id": "970",
    "name": "Sour",
    "ar_name": "صور",
    "wilaya_id": "27"
  },
  {
    "id": "971",
    "name": "Oued El Kheir",
    "ar_name": "واد الخير",
    "wilaya_id": "27"
  },
  {
    "id": "972",
    "name": "Sidi Bellater",
    "ar_name": "سيدي بلعاتر",
    "wilaya_id": "27"
  },
  {
    "id": "973",
    "name": "Kheiredine",
    "ar_name": "خير الدين",
    "wilaya_id": "27"
  },
  {
    "id": "974",
    "name": "Sidi Ali",
    "ar_name": "سيدي علي",
    "wilaya_id": "27"
  },
  {
    "id": "975",
    "name": "Abdelmalek Ramdane",
    "ar_name": "عبد المالك رمضان",
    "wilaya_id": "27"
  },
  {
    "id": "976",
    "name": "Hadjadj",
    "ar_name": "حجاج",
    "wilaya_id": "27"
  },
  {
    "id": "977",
    "name": "Nekmaria",
    "ar_name": "نقمارية",
    "wilaya_id": "27"
  },
  {
    "id": "978",
    "name": "Sidi Lakhdar",
    "ar_name": "سيدي لخضر",
    "wilaya_id": "27"
  },
  {
    "id": "979",
    "name": "Achaacha",
    "ar_name": "عشعاشة",
    "wilaya_id": "27"
  },
  {
    "id": "980",
    "name": "Khadra",
    "ar_name": "خضراء",
    "wilaya_id": "27"
  },
  {
    "id": "981",
    "name": "Bouguirat",
    "ar_name": "بوقيراط",
    "wilaya_id": "27"
  },
  {
    "id": "982",
    "name": "Sirat",
    "ar_name": "سيرات",
    "wilaya_id": "27"
  },
  {
    "id": "983",
    "name": "Ain Sidi Cherif",
    "ar_name": "عين سيدي شريف",
    "wilaya_id": "27"
  },
  {
    "id": "984",
    "name": "Mesra",
    "ar_name": "ماسرة",
    "wilaya_id": "27"
  },
  {
    "id": "985",
    "name": "Mansourah",
    "ar_name": "منصورة",
    "wilaya_id": "27"
  },
  {
    "id": "986",
    "name": "Souaflia",
    "ar_name": "سوافلية",
    "wilaya_id": "27"
  },
  {
    "id": "987",
    "name": "Ouled Boughalem",
    "ar_name": "أوالد بوغالم",
    "wilaya_id": "27"
  },
  {
    "id": "988",
    "name": "Ouled Maallah",
    "ar_name": "أولاد مع اللّه",
    "wilaya_id": "27"
  },
  {
    "id": "989",
    "name": "Mezghrane",
    "ar_name": "مزغران",
    "wilaya_id": "27"
  },
  {
    "id": "990",
    "name": "Ain Boudinar",
    "ar_name": "عين بودينار",
    "wilaya_id": "27"
  },
  {
    "id": "991",
    "name": "Tazgait",
    "ar_name": "تزقايت",
    "wilaya_id": "27"
  },
  {
    "id": "992",
    "name": "Safsaf",
    "ar_name": "صفصاف",
    "wilaya_id": "27"
  },
  {
    "id": "993",
    "name": "Touahria",
    "ar_name": "طواھيرية",
    "wilaya_id": "27"
  },
  {
    "id": "994",
    "name": "El Hassiane",
    "ar_name": "الحسيان",
    "wilaya_id": "27"
  },
  {
    "id": "995",
    "name": "Msila",
    "ar_name": "المسيلة",
    "wilaya_id": "28"
  },
  {
    "id": "996",
    "name": "Maadid",
    "ar_name": "المعاضيد",
    "wilaya_id": "28"
  },
  {
    "id": "997",
    "name": "Hammam Dhalaa",
    "ar_name": "حمـام الضلعة",
    "wilaya_id": "68"
  },
  {
    "id": "998",
    "name": "Ouled Derradj",
    "ar_name": "أولاد دراج",
    "wilaya_id": "28"
  },
  {
    "id": "999",
    "name": "Tarmount",
    "ar_name": "تارمونت",
    "wilaya_id": "28"
  },
  {
    "id": "1000",
    "name": "Mtarfa",
    "ar_name": "مطارفة",
    "wilaya_id": "28"
  },
  {
    "id": "1001",
    "name": "Khoubana",
    "ar_name": "خبانة",
    "wilaya_id": "28"
  },
  {
    "id": "1002",
    "name": "M'cif",
    "ar_name": "مسيف",
    "wilaya_id": "28"
  },
  {
    "id": "1003",
    "name": "Chellal",
    "ar_name": "شلال",
    "wilaya_id": "28"
  },
  {
    "id": "1004",
    "name": "Ouled Madhi",
    "ar_name": "أولاد مـاضي",
    "wilaya_id": "68"
  },
  {
    "id": "1005",
    "name": "Magra",
    "ar_name": "مقرة",
    "wilaya_id": "68"
  },
  {
    "id": "1006",
    "name": "Berhoum",
    "ar_name": "برهوم",
    "wilaya_id": "28"
  },
  {
    "id": "1007",
    "name": "Ain Khadra",
    "ar_name": "عين الخضراء",
    "wilaya_id": "28"
  },
  {
    "id": "1008",
    "name": "Ouled Addi Guebala",
    "ar_name": "اولاد عدي لقبالة",
    "wilaya_id": "28"
  },
  {
    "id": "1009",
    "name": "Belaiba",
    "ar_name": "بلعايبة",
    "wilaya_id": "68"
  },
  {
    "id": "1010",
    "name": "Sidi Aissa",
    "ar_name": "سيدي عيسى",
    "wilaya_id": "28"
  },
  {
    "id": "1011",
    "name": "Ain El Hadjel",
    "ar_name": "عين الحجل",
    "wilaya_id": "68"
  },
  {
    "id": "1012",
    "name": "Sidi Hadjeres",
    "ar_name": "سيدي ھجرس",
    "wilaya_id": "28"
  },
  {
    "id": "1013",
    "name": "Ouanougha",
    "ar_name": "ونوغة",
    "wilaya_id": "28"
  },
  {
    "id": "1014",
    "name": "Bou Saada",
    "ar_name": "بوسعادة",
    "wilaya_id": "68"
  },
  {
    "id": "1015",
    "name": "Ouled Sidi Brahim",
    "ar_name": "أولاد سيدي ابراهيم",
    "wilaya_id": "68"
  },
  {
    "id": "1016",
    "name": "Sidi Ameur",
    "ar_name": "سيدي عامر",
    "wilaya_id": "68"
  },
  {
    "id": "1017",
    "name": "Tamsa",
    "ar_name": "تامسة",
    "wilaya_id": "68"
  },
  {
    "id": "1018",
    "name": "Ben Srour",
    "ar_name": "بن سرور",
    "wilaya_id": "68"
  },
  {
    "id": "1019",
    "name": "Ouled Slimane",
    "ar_name": "أولاد سليمان",
    "wilaya_id": "28"
  },
  {
    "id": "1020",
    "name": "El Houamed",
    "ar_name": "الحوامد",
    "wilaya_id": "28"
  },
  {
    "id": "1021",
    "name": "El Hamel",
    "ar_name": "الهامل",
    "wilaya_id": "28"
  },
  {
    "id": "1022",
    "name": "Ouled Mansour",
    "ar_name": "أولاد منصور",
    "wilaya_id": "28"
  },
  {
    "id": "1023",
    "name": "Maarif",
    "ar_name": "المعاريف",
    "wilaya_id": "68"
  },
  {
    "id": "1024",
    "name": "Dehahna",
    "ar_name": "الدهاهنة",
    "wilaya_id": "68"
  },
  {
    "id": "1025",
    "name": "Bouti Sayah",
    "ar_name": "بوطي السايح",
    "wilaya_id": "68"
  },
  {
    "id": "1026",
    "name": "Khettouti Sed Djir",
    "ar_name": "خطوطي سد الجير",
    "wilaya_id": "68"
  },
  {
    "id": "1027",
    "name": "Zarzour",
    "ar_name": "الزرزور",
    "wilaya_id": "28"
  },
  {
    "id": "1028",
    "name": "Oued Chair",
    "ar_name": "محمد بوضياف",
    "wilaya_id": "28"
  },
  {
    "id": "1029",
    "name": "Benzouh",
    "ar_name": "بن الزوه",
    "wilaya_id": "28"
  },
  {
    "id": "1030",
    "name": "Bir Foda",
    "ar_name": "بير الفضة",
    "wilaya_id": "28"
  },
  {
    "id": "1031",
    "name": "Ain Fares",
    "ar_name": "عين فارس",
    "wilaya_id": "28"
  },
  {
    "id": "1032",
    "name": "Sidi Mhamed",
    "ar_name": "سيدي محمد",
    "wilaya_id": "28"
  },
  {
    "id": "1033",
    "name": "Ouled Atia",
    "ar_name": "منعة",
    "wilaya_id": "28"
  },
  {
    "id": "1034",
    "name": "Souamaa",
    "ar_name": "الصوامع",
    "wilaya_id": "28"
  },
  {
    "id": "1035",
    "name": "Ain El Melh",
    "ar_name": "عين الملح",
    "wilaya_id": "68"
  },
  {
    "id": "1036",
    "name": "Medjedel",
    "ar_name": "مجدل",
    "wilaya_id": "28"
  },
  {
    "id": "1037",
    "name": "Slim",
    "ar_name": "سليم",
    "wilaya_id": "68"
  },
  {
    "id": "1038",
    "name": "Ain Errich",
    "ar_name": "عين الريش",
    "wilaya_id": "68"
  },
  {
    "id": "1039",
    "name": "Beni Ilmane",
    "ar_name": "بنى يلمان",
    "wilaya_id": "28"
  },
  {
    "id": "1040",
    "name": "Oultene",
    "ar_name": "ولتام",
    "wilaya_id": "28"
  },
  {
    "id": "1041",
    "name": "Djebel Messaad",
    "ar_name": "جبل مساعد",
    "wilaya_id": "68"
  },
  {
    "id": "1042",
    "name": "Mascara",
    "ar_name": "مـعـسـكـر",
    "wilaya_id": "29"
  },
  {
    "id": "1043",
    "name": "Bou Hanifia",
    "ar_name": "بوحنيفية",
    "wilaya_id": "29"
  },
  {
    "id": "1044",
    "name": "Tizi",
    "ar_name": "تيزي",
    "wilaya_id": "29"
  },
  {
    "id": "1045",
    "name": "Hacine",
    "ar_name": "حسين",
    "wilaya_id": "29"
  },
  {
    "id": "1046",
    "name": "Maoussa",
    "ar_name": "ماوسة",
    "wilaya_id": "29"
  },
  {
    "id": "1047",
    "name": "Teghennif",
    "ar_name": "تيغنيف",
    "wilaya_id": "29"
  },
  {
    "id": "1048",
    "name": "El Hachem",
    "ar_name": "الهاشم",
    "wilaya_id": "29"
  },
  {
    "id": "1049",
    "name": "Sidi Kada",
    "ar_name": "سيدي قادة",
    "wilaya_id": "29"
  },
  {
    "id": "1050",
    "name": "Zelmata",
    "ar_name": "زلماطة",
    "wilaya_id": "29"
  },
  {
    "id": "1051",
    "name": "Oued El Abtal",
    "ar_name": "واد الأبطال",
    "wilaya_id": "29"
  },
  {
    "id": "1052",
    "name": "Ain Ferah",
    "ar_name": "عين فراح",
    "wilaya_id": "29"
  },
  {
    "id": "1053",
    "name": "Ghriss",
    "ar_name": "غريس",
    "wilaya_id": "29"
  },
  {
    "id": "1054",
    "name": "Froha",
    "ar_name": "فروحة",
    "wilaya_id": "29"
  },
  {
    "id": "1055",
    "name": "Matemore",
    "ar_name": "مطمور",
    "wilaya_id": "29"
  },
  {
    "id": "1056",
    "name": "Makdha",
    "ar_name": "ماقضة",
    "wilaya_id": "29"
  },
  {
    "id": "1057",
    "name": "Sidi Boussaid",
    "ar_name": "سيدي بوسعيد",
    "wilaya_id": "29"
  },
  {
    "id": "1058",
    "name": "El Bordj",
    "ar_name": "البرج",
    "wilaya_id": "29"
  },
  {
    "id": "1059",
    "name": "Ain Fekan",
    "ar_name": "عين فكان",
    "wilaya_id": "29"
  },
  {
    "id": "1060",
    "name": "Benian",
    "ar_name": "بنيان",
    "wilaya_id": "29"
  },
  {
    "id": "1061",
    "name": "Khalouia",
    "ar_name": "خلوية",
    "wilaya_id": "29"
  },
  {
    "id": "1062",
    "name": "El Menaouer",
    "ar_name": "المناور",
    "wilaya_id": "29"
  },
  {
    "id": "1063",
    "name": "Oued Taria",
    "ar_name": "واد التاغية",
    "wilaya_id": "29"
  },
  {
    "id": "1064",
    "name": "Aouf",
    "ar_name": "عوف",
    "wilaya_id": "29"
  },
  {
    "id": "1065",
    "name": "Ain Fares",
    "ar_name": "عين فارس",
    "wilaya_id": "29"
  },
  {
    "id": "1066",
    "name": "Ain Frass",
    "ar_name": "عين فراس",
    "wilaya_id": "29"
  },
  {
    "id": "1067",
    "name": "Sig",
    "ar_name": "سيڨ",
    "wilaya_id": "29"
  },
  {
    "id": "1068",
    "name": "Oggaz",
    "ar_name": "عقاز",
    "wilaya_id": "29"
  },
  {
    "id": "1069",
    "name": "Alaimia",
    "ar_name": "العلايمية",
    "wilaya_id": "29"
  },
  {
    "id": "1070",
    "name": "El Gaada",
    "ar_name": "القعدة",
    "wilaya_id": "29"
  },
  {
    "id": "1071",
    "name": "Zahana",
    "ar_name": "زھانة",
    "wilaya_id": "29"
  },
  {
    "id": "1072",
    "name": "Mohammadia",
    "ar_name": "المحمدية",
    "wilaya_id": "29"
  },
  {
    "id": "1073",
    "name": "Sidi Abdelmoumene",
    "ar_name": "سيدي عبد المومن",
    "wilaya_id": "29"
  },
  {
    "id": "1074",
    "name": "Ferraguig",
    "ar_name": "فرقيق",
    "wilaya_id": "29"
  },
  {
    "id": "1075",
    "name": "El Ghomri",
    "ar_name": "الغمري",
    "wilaya_id": "29"
  },
  {
    "id": "1076",
    "name": "Sedjerara",
    "ar_name": "سجرارة",
    "wilaya_id": "29"
  },
  {
    "id": "1077",
    "name": "Moctadouz",
    "ar_name": "مقطع الدوز",
    "wilaya_id": "29"
  },
  {
    "id": "1078",
    "name": "Bou Henni",
    "ar_name": "بوهني",
    "wilaya_id": "29"
  },
  {
    "id": "1079",
    "name": "Guettena",
    "ar_name": "القيطنة",
    "wilaya_id": "29"
  },
  {
    "id": "1080",
    "name": "El Mamounia",
    "ar_name": "المامونية",
    "wilaya_id": "29"
  },
  {
    "id": "1081",
    "name": "El Keurt",
    "ar_name": "الكرط",
    "wilaya_id": "29"
  },
  {
    "id": "1082",
    "name": "Gharrous",
    "ar_name": "غروس",
    "wilaya_id": "29"
  },
  {
    "id": "1083",
    "name": "Gherdjoum",
    "ar_name": "ڤرجوم",
    "wilaya_id": "29"
  },
  {
    "id": "1084",
    "name": "Chorfa",
    "ar_name": "الشرفة",
    "wilaya_id": "29"
  },
  {
    "id": "1085",
    "name": "Ras Ain Amirouche",
    "ar_name": "رأس العين عميروش",
    "wilaya_id": "29"
  },
  {
    "id": "1086",
    "name": "Nesmot",
    "ar_name": "نسموط",
    "wilaya_id": "29"
  },
  {
    "id": "1087",
    "name": "Sidi Abdeldjebar",
    "ar_name": "سيدي عبد الجبار",
    "wilaya_id": "29"
  },
  {
    "id": "1088",
    "name": "Sehailia",
    "ar_name": "سحايلية",
    "wilaya_id": "29"
  },
  {
    "id": "1089",
    "name": "Ouargla",
    "ar_name": "ورڨلة",
    "wilaya_id": "30"
  },
  {
    "id": "1090",
    "name": "Ain Beida",
    "ar_name": "عين البيضاء",
    "wilaya_id": "30"
  },
  {
    "id": "1091",
    "name": "Ngoussa",
    "ar_name": "نقوسة",
    "wilaya_id": "30"
  },
  {
    "id": "1092",
    "name": "Hassi Messaoud",
    "ar_name": "حاسي مسعود",
    "wilaya_id": "30"
  },
  {
    "id": "1093",
    "name": "Rouissat",
    "ar_name": "الرويسات",
    "wilaya_id": "30"
  },
  {
    "id": "1094",
    "name": "Balidat Ameur",
    "ar_name": "بليدة عامر",
    "wilaya_id": "30"
  },
  {
    "id": "1095",
    "name": "Tebesbest",
    "ar_name": "تبسبست",
    "wilaya_id": "55"
  },
  {
    "id": "1096",
    "name": "Nezla",
    "ar_name": "نزلة",
    "wilaya_id": "55"
  },
  {
    "id": "1097",
    "name": "Zaouia El Abidia",
    "ar_name": "الزاوية العابدية",
    "wilaya_id": "55"
  },
  {
    "id": "1098",
    "name": "Sidi Slimane",
    "ar_name": "سيدي سليمان",
    "wilaya_id": "55"
  },
  {
    "id": "1099",
    "name": "Sidi Khouiled",
    "ar_name": "سيدي خويلد",
    "wilaya_id": "30"
  },
  {
    "id": "1100",
    "name": "Hassi Ben Abdellah",
    "ar_name": "حاسي بن عبد ﷲ",
    "wilaya_id": "30"
  },
  {
    "id": "1101",
    "name": "Touggourt",
    "ar_name": "توقرت",
    "wilaya_id": "55"
  },
  {
    "id": "1102",
    "name": "El Hadjira",
    "ar_name": "الحجيرة",
    "wilaya_id": "55"
  },
  {
    "id": "1103",
    "name": "Taibet",
    "ar_name": "الطيبات",
    "wilaya_id": "55"
  },
  {
    "id": "1104",
    "name": "Tamacine",
    "ar_name": "تماسين",
    "wilaya_id": "55"
  },
  {
    "id": "1105",
    "name": "Benaceur",
    "ar_name": "بن ناصر",
    "wilaya_id": "55"
  },
  {
    "id": "1106",
    "name": "Mnaguer",
    "ar_name": "المنقر",
    "wilaya_id": "55"
  },
  {
    "id": "1107",
    "name": "Megarine",
    "ar_name": "المقارين",
    "wilaya_id": "55"
  },
  {
    "id": "1108",
    "name": "El Allia",
    "ar_name": "العالية",
    "wilaya_id": "55"
  },
  {
    "id": "1109",
    "name": "El Borma",
    "ar_name": "البرمة",
    "wilaya_id": "30"
  },
  {
    "id": "1110",
    "name": "Oran",
    "ar_name": "وهران",
    "wilaya_id": "31"
  },
  {
    "id": "1111",
    "name": "Gdyel",
    "ar_name": "ڨديل",
    "wilaya_id": "31"
  },
  {
    "id": "1112",
    "name": "Bir El Djir",
    "ar_name": "بئر الجير",
    "wilaya_id": "31"
  },
  {
    "id": "1113",
    "name": "Hassi Bounif",
    "ar_name": "حاسيْ بُونِيف",
    "wilaya_id": "31"
  },
  {
    "id": "1114",
    "name": "Es Senia",
    "ar_name": "السانية",
    "wilaya_id": "31"
  },
  {
    "id": "1115",
    "name": "Arzew",
    "ar_name": "أرزيو",
    "wilaya_id": "31"
  },
  {
    "id": "1116",
    "name": "Bethioua",
    "ar_name": "ﺑﻃﻴﻭة",
    "wilaya_id": "31"
  },
  {
    "id": "1117",
    "name": "Marsat El Hadjadj",
    "ar_name": "مَرس ألحَجَاج",
    "wilaya_id": "31"
  },
  {
    "id": "1118",
    "name": "Ain Turk",
    "ar_name": "عيْن التُرْكْ",
    "wilaya_id": "31"
  },
  {
    "id": "1119",
    "name": "El Ancar",
    "ar_name": "العنصر",
    "wilaya_id": "31"
  },
  {
    "id": "1120",
    "name": "Oued Tlelat",
    "ar_name": "وادى تليلات",
    "wilaya_id": "31"
  },
  {
    "id": "1121",
    "name": "Tafraoui",
    "ar_name": "طفراوي",
    "wilaya_id": "31"
  },
  {
    "id": "1122",
    "name": "Sidi Chami",
    "ar_name": "سيدي الشحمي",
    "wilaya_id": "31"
  },
  {
    "id": "1123",
    "name": "Boufatis",
    "ar_name": "بوفاطيس",
    "wilaya_id": "31"
  },
  {
    "id": "1124",
    "name": "Mers El Kebir",
    "ar_name": "المرسى الكبير",
    "wilaya_id": "31"
  },
  {
    "id": "1125",
    "name": "Bousfer",
    "ar_name": "بوسفر",
    "wilaya_id": "31"
  },
  {
    "id": "1126",
    "name": "El Karma",
    "ar_name": "الكرمة",
    "wilaya_id": "31"
  },
  {
    "id": "1127",
    "name": "El Braya",
    "ar_name": "ألبْرَيَ",
    "wilaya_id": "31"
  },
  {
    "id": "1128",
    "name": "Hassi Ben Okba",
    "ar_name": "حاسي بن عقبة",
    "wilaya_id": "31"
  },
  {
    "id": "1129",
    "name": "Ben Freha",
    "ar_name": "بن فريحة",
    "wilaya_id": "31"
  },
  {
    "id": "1130",
    "name": "Hassi Mefsoukh",
    "ar_name": "حاسي مفسوخ",
    "wilaya_id": "31"
  },
  {
    "id": "1131",
    "name": "Sidi Ben Yabka",
    "ar_name": "سيدي بن يبقى",
    "wilaya_id": "31"
  },
  {
    "id": "1132",
    "name": "Messerghin",
    "ar_name": "مسرغين",
    "wilaya_id": "31"
  },
  {
    "id": "1133",
    "name": "Boutlelis",
    "ar_name": "بوتليليس",
    "wilaya_id": "31"
  },
  {
    "id": "1134",
    "name": "Ain Kerma",
    "ar_name": "عين الكرمة",
    "wilaya_id": "31"
  },
  {
    "id": "1135",
    "name": "Ain Biya",
    "ar_name": "عين البية",
    "wilaya_id": "31"
  },
  {
    "id": "1136",
    "name": "El Bayadh",
    "ar_name": "الـبـيـض",
    "wilaya_id": "32"
  },
  {
    "id": "1137",
    "name": "Rogassa",
    "ar_name": "روقاصة",
    "wilaya_id": "32"
  },
  {
    "id": "1138",
    "name": "Stitten",
    "ar_name": "ستيتين",
    "wilaya_id": "32"
  },
  {
    "id": "1139",
    "name": "Brezina",
    "ar_name": "بريزينة",
    "wilaya_id": "32"
  },
  {
    "id": "1140",
    "name": "Ghassoul",
    "ar_name": "غسول",
    "wilaya_id": "32"
  },
  {
    "id": "1141",
    "name": "Boualem",
    "ar_name": "بوعلام",
    "wilaya_id": "32"
  },
  {
    "id": "1142",
    "name": "El Abiodh Sidi Cheikh",
    "ar_name": "الابيض سيدي الشيخ",
    "wilaya_id": "69"
  },
  {
    "id": "1143",
    "name": "Ain El Orak",
    "ar_name": "عين العراك",
    "wilaya_id": "69"
  },
  {
    "id": "1144",
    "name": "Arbaouat",
    "ar_name": "أربوات",
    "wilaya_id": "69"
  },
  {
    "id": "1145",
    "name": "Bougtoub",
    "ar_name": "بوقطب",
    "wilaya_id": "32"
  },
  {
    "id": "1146",
    "name": "El Kheither",
    "ar_name": "الخيثر",
    "wilaya_id": "32"
  },
  {
    "id": "1147",
    "name": "Kef El Ahmar",
    "ar_name": "الكاف الاحمر",
    "wilaya_id": "32"
  },
  {
    "id": "1148",
    "name": "Boussemghoun",
    "ar_name": "بوسمغون",
    "wilaya_id": "69"
  },
  {
    "id": "1149",
    "name": "Chellala",
    "ar_name": "شلالة",
    "wilaya_id": "69"
  },
  {
    "id": "1150",
    "name": "Krakda",
    "ar_name": "كراكدة",
    "wilaya_id": "32"
  },
  {
    "id": "1151",
    "name": "El Bnoud",
    "ar_name": "البنود",
    "wilaya_id": "32"
  },
  {
    "id": "1152",
    "name": "Cheguig",
    "ar_name": "الشقيق",
    "wilaya_id": "32"
  },
  {
    "id": "1153",
    "name": "Sidi Ameur",
    "ar_name": "سيدي عامر",
    "wilaya_id": "32"
  },
  {
    "id": "1154",
    "name": "El Mehara",
    "ar_name": "المھارة",
    "wilaya_id": "69"
  },
  {
    "id": "1155",
    "name": "Tousmouline",
    "ar_name": "توسمولين",
    "wilaya_id": "32"
  },
  {
    "id": "1156",
    "name": "Sidi Slimane",
    "ar_name": "سيدي سليمان",
    "wilaya_id": "32"
  },
  {
    "id": "1157",
    "name": "Sidi Tifour",
    "ar_name": "سيدي طيفور",
    "wilaya_id": "32"
  },
  {
    "id": "1158",
    "name": "Illizi",
    "ar_name": "إلـيـزي",
    "wilaya_id": "33"
  },
  {
    "id": "1159",
    "name": "Djanet",
    "ar_name": "جانت",
    "wilaya_id": "56"
  },
  {
    "id": "1160",
    "name": "Debdeb",
    "ar_name": "دبداب",
    "wilaya_id": "33"
  },
  {
    "id": "1161",
    "name": "Bordj Omar Driss",
    "ar_name": "برج عمر ادريس",
    "wilaya_id": "33"
  },
  {
    "id": "1162",
    "name": "Bordj El Haouasse",
    "ar_name": "برج الحواس",
    "wilaya_id": "56"
  },
  {
    "id": "1163",
    "name": "In Amenas",
    "ar_name": "إن أميناس",
    "wilaya_id": "33"
  },
  {
    "id": "1164",
    "name": "Bordj Bou Arreridj",
    "ar_name": "برج بوعريريج",
    "wilaya_id": "34"
  },
  {
    "id": "1165",
    "name": "Ras El Oued",
    "ar_name": "رأس الوادي",
    "wilaya_id": "34"
  },
  {
    "id": "1166",
    "name": "Bordj Zemoura",
    "ar_name": "برج زمورة",
    "wilaya_id": "34"
  },
  {
    "id": "1167",
    "name": "Mansoura",
    "ar_name": "منصورة",
    "wilaya_id": "34"
  },
  {
    "id": "1168",
    "name": "El Mhir",
    "ar_name": "المھير",
    "wilaya_id": "34"
  },
  {
    "id": "1169",
    "name": "Ben Daoud",
    "ar_name": "بن داود",
    "wilaya_id": "34"
  },
  {
    "id": "1170",
    "name": "El Achir",
    "ar_name": "العشير",
    "wilaya_id": "34"
  },
  {
    "id": "1171",
    "name": "Ain Taghrout",
    "ar_name": "عين تاغروت",
    "wilaya_id": "34"
  },
  {
    "id": "1172",
    "name": "Bordj Ghdir",
    "ar_name": "برج غدير",
    "wilaya_id": "34"
  },
  {
    "id": "1173",
    "name": "Sidi Embarek",
    "ar_name": "سيدي مبارك",
    "wilaya_id": "34"
  },
  {
    "id": "1174",
    "name": "El Hamadia",
    "ar_name": "الحمادية",
    "wilaya_id": "34"
  },
  {
    "id": "1175",
    "name": "Belimour",
    "ar_name": "بليمور",
    "wilaya_id": "34"
  },
  {
    "id": "1176",
    "name": "Medjana",
    "ar_name": "مجانة",
    "wilaya_id": "34"
  },
  {
    "id": "1177",
    "name": "Teniet En Nasr",
    "ar_name": "ثنية النصر",
    "wilaya_id": "34"
  },
  {
    "id": "1178",
    "name": "Djaafra",
    "ar_name": "جعافرة",
    "wilaya_id": "34"
  },
  {
    "id": "1179",
    "name": "El Main",
    "ar_name": "إلماين",
    "wilaya_id": "34"
  },
  {
    "id": "1180",
    "name": "Ouled Brahem",
    "ar_name": "أولاد ابراھم",
    "wilaya_id": "34"
  },
  {
    "id": "1181",
    "name": "Ouled Dahmane",
    "ar_name": "أولاد دحمان",
    "wilaya_id": "34"
  },
  {
    "id": "1182",
    "name": "Hasnaoua",
    "ar_name": "حسناوة",
    "wilaya_id": "34"
  },
  {
    "id": "1183",
    "name": "Khelil",
    "ar_name": "خليل",
    "wilaya_id": "34"
  },
  {
    "id": "1184",
    "name": "Taglait",
    "ar_name": "تاقلعيت",
    "wilaya_id": "34"
  },
  {
    "id": "1185",
    "name": "Ksour",
    "ar_name": "القصور",
    "wilaya_id": "34"
  },
  {
    "id": "1186",
    "name": "Ouled Sidi Brahim",
    "ar_name": "آث سيذى پراهم.",
    "wilaya_id": "34"
  },
  {
    "id": "1187",
    "name": "Tafreg",
    "ar_name": "تفرڨ",
    "wilaya_id": "34"
  },
  {
    "id": "1188",
    "name": "Colla",
    "ar_name": "القلة",
    "wilaya_id": "34"
  },
  {
    "id": "1189",
    "name": "Tixter",
    "ar_name": "تقصطر",
    "wilaya_id": "34"
  },
  {
    "id": "1190",
    "name": "El Ach",
    "ar_name": "العش",
    "wilaya_id": "34"
  },
  {
    "id": "1191",
    "name": "El Anseur",
    "ar_name": "العناصر",
    "wilaya_id": "34"
  },
  {
    "id": "1192",
    "name": "Tesmart",
    "ar_name": "تسمارت",
    "wilaya_id": "34"
  },
  {
    "id": "1193",
    "name": "Ain Tesra",
    "ar_name": "عين تسرة",
    "wilaya_id": "34"
  },
  {
    "id": "1194",
    "name": "Bir Kasdali",
    "ar_name": "بئر قصد علي",
    "wilaya_id": "34"
  },
  {
    "id": "1195",
    "name": "Ghilassa",
    "ar_name": "غيلاسة",
    "wilaya_id": "34"
  },
  {
    "id": "1196",
    "name": "Rabta",
    "ar_name": "الرابطة",
    "wilaya_id": "34"
  },
  {
    "id": "1197",
    "name": "Haraza",
    "ar_name": "الحرازة",
    "wilaya_id": "34"
  },
  {
    "id": "1198",
    "name": "Boumerdes",
    "ar_name": "بومرداس",
    "wilaya_id": "35"
  },
  {
    "id": "1199",
    "name": "Boudouaou",
    "ar_name": "بودواو",
    "wilaya_id": "35"
  },
  {
    "id": "1200",
    "name": "Afir",
    "ar_name": "أفير",
    "wilaya_id": "35"
  },
  {
    "id": "1201",
    "name": "Bordj Menaiel",
    "ar_name": "برج منايل",
    "wilaya_id": "35"
  },
  {
    "id": "1202",
    "name": "Baghlia",
    "ar_name": "بغلية",
    "wilaya_id": "35"
  },
  {
    "id": "1203",
    "name": "Sidi Daoud",
    "ar_name": "سيدي داود",
    "wilaya_id": "35"
  },
  {
    "id": "1204",
    "name": "Naciria",
    "ar_name": "الناصرية",
    "wilaya_id": "35"
  },
  {
    "id": "1205",
    "name": "Djinet",
    "ar_name": "جنات",
    "wilaya_id": "35"
  },
  {
    "id": "1206",
    "name": "Isser",
    "ar_name": "يسر",
    "wilaya_id": "35"
  },
  {
    "id": "1207",
    "name": "Zemmouri",
    "ar_name": "زموري",
    "wilaya_id": "35"
  },
  {
    "id": "1208",
    "name": "Si Mustapha",
    "ar_name": "سي مصطفى",
    "wilaya_id": "35"
  },
  {
    "id": "1209",
    "name": "Tidjelabine",
    "ar_name": "تيجلابين",
    "wilaya_id": "35"
  },
  {
    "id": "1210",
    "name": "Chabet El Ameur",
    "ar_name": "شعبة العامر",
    "wilaya_id": "35"
  },
  {
    "id": "1211",
    "name": "Thenia",
    "ar_name": "الثنية",
    "wilaya_id": "35"
  },
  {
    "id": "1212",
    "name": "Timezrit",
    "ar_name": "تمزريت",
    "wilaya_id": "35"
  },
  {
    "id": "1213",
    "name": "Corso",
    "ar_name": "قورصو",
    "wilaya_id": "35"
  },
  {
    "id": "1214",
    "name": "Ouled Moussa",
    "ar_name": "أولاد موسى",
    "wilaya_id": "35"
  },
  {
    "id": "1215",
    "name": "Larbatache",
    "ar_name": "الأربعطاش",
    "wilaya_id": "35"
  },
  {
    "id": "1216",
    "name": "Bouzegza Keddara",
    "ar_name": "بوزقزة قدارة",
    "wilaya_id": "35"
  },
  {
    "id": "1217",
    "name": "Taourga",
    "ar_name": "تورقة",
    "wilaya_id": "35"
  },
  {
    "id": "1218",
    "name": "Ouled Aissa",
    "ar_name": "أولاد عيسى",
    "wilaya_id": "35"
  },
  {
    "id": "1219",
    "name": "Ben Choud",
    "ar_name": "بن شود",
    "wilaya_id": "35"
  },
  {
    "id": "1220",
    "name": "Dellys",
    "ar_name": "دلس",
    "wilaya_id": "35"
  },
  {
    "id": "1221",
    "name": "Ammal",
    "ar_name": "عمال",
    "wilaya_id": "35"
  },
  {
    "id": "1222",
    "name": "Beni Amrane",
    "ar_name": "بنى عمران",
    "wilaya_id": "35"
  },
  {
    "id": "1223",
    "name": "Souk El Had",
    "ar_name": "سوق الحد",
    "wilaya_id": "35"
  },
  {
    "id": "1224",
    "name": "Boudouaou El Bahri",
    "ar_name": "بودواو البحرى",
    "wilaya_id": "35"
  },
  {
    "id": "1225",
    "name": "Ouled Hedadj",
    "ar_name": "أولاد ھداج",
    "wilaya_id": "35"
  },
  {
    "id": "1226",
    "name": "Laghata",
    "ar_name": "لقاطة",
    "wilaya_id": "35"
  },
  {
    "id": "1227",
    "name": "Hammedi",
    "ar_name": "حمادى",
    "wilaya_id": "35"
  },
  {
    "id": "1228",
    "name": "Khemis El Khechna",
    "ar_name": "خميس الخشنة",
    "wilaya_id": "35"
  },
  {
    "id": "1229",
    "name": "El Kharrouba",
    "ar_name": "الخروبة",
    "wilaya_id": "35"
  },
  {
    "id": "1230",
    "name": "El Tarf",
    "ar_name": "الطارف",
    "wilaya_id": "36"
  },
  {
    "id": "1231",
    "name": "Bouhadjar",
    "ar_name": "بوحجار",
    "wilaya_id": "36"
  },
  {
    "id": "1232",
    "name": "Ben Mhidi",
    "ar_name": "بن مهيدى",
    "wilaya_id": "36"
  },
  {
    "id": "1233",
    "name": "Bougous",
    "ar_name": "بوقوس",
    "wilaya_id": "36"
  },
  {
    "id": "1234",
    "name": "El Kala",
    "ar_name": "القالة",
    "wilaya_id": "36"
  },
  {
    "id": "1235",
    "name": "Ain El Assel",
    "ar_name": "عين العسل",
    "wilaya_id": "36"
  },
  {
    "id": "1236",
    "name": "El Aioun",
    "ar_name": "العيون",
    "wilaya_id": "36"
  },
  {
    "id": "1237",
    "name": "Bouteldja",
    "ar_name": "بوثلجة",
    "wilaya_id": "36"
  },
  {
    "id": "1238",
    "name": "Souarekh",
    "ar_name": "السوارخ",
    "wilaya_id": "36"
  },
  {
    "id": "1239",
    "name": "Berrihane",
    "ar_name": "برحان",
    "wilaya_id": "36"
  },
  {
    "id": "1240",
    "name": "Lac Des Oiseaux",
    "ar_name": "بحيرة الطيور",
    "wilaya_id": "36"
  },
  {
    "id": "1241",
    "name": "Chefia",
    "ar_name": "الشافية",
    "wilaya_id": "36"
  },
  {
    "id": "1242",
    "name": "Drean",
    "ar_name": "الذرعان",
    "wilaya_id": "36"
  },
  {
    "id": "1243",
    "name": "Chihani",
    "ar_name": "شهانى",
    "wilaya_id": "36"
  },
  {
    "id": "1244",
    "name": "Chebaita Mokhtar",
    "ar_name": "شبيطة مختار",
    "wilaya_id": "36"
  },
  {
    "id": "1245",
    "name": "Besbes",
    "ar_name": "البسباس",
    "wilaya_id": "36"
  },
  {
    "id": "1246",
    "name": "Asfour",
    "ar_name": "عصفور",
    "wilaya_id": "36"
  },
  {
    "id": "1247",
    "name": "Echatt",
    "ar_name": "الشط",
    "wilaya_id": "36"
  },
  {
    "id": "1248",
    "name": "Zerizer",
    "ar_name": "زريزر",
    "wilaya_id": "36"
  },
  {
    "id": "1249",
    "name": "Zitouna",
    "ar_name": "الزيتونة",
    "wilaya_id": "36"
  },
  {
    "id": "1250",
    "name": "Ain Kerma",
    "ar_name": "عين الكرمة",
    "wilaya_id": "36"
  },
  {
    "id": "1251",
    "name": "Oued Zitoun",
    "ar_name": "وادى الزيتون",
    "wilaya_id": "36"
  },
  {
    "id": "1252",
    "name": "Hammam Beni Salah",
    "ar_name": "حمام بنى صالح",
    "wilaya_id": "36"
  },
  {
    "id": "1253",
    "name": "Raml Souk",
    "ar_name": "رمل سوق",
    "wilaya_id": "36"
  },
  {
    "id": "1254",
    "name": "Tindouf",
    "ar_name": "تندوف",
    "wilaya_id": "37"
  },
  {
    "id": "1255",
    "name": "Oum El Assel",
    "ar_name": "أم العسل",
    "wilaya_id": "37"
  },
  {
    "id": "1256",
    "name": "Tissemsilt",
    "ar_name": "تـيـسـمـسـيـلـت",
    "wilaya_id": "38"
  },
  {
    "id": "1257",
    "name": "Bordj Bou Naama",
    "ar_name": "برج بونعامة",
    "wilaya_id": "38"
  },
  {
    "id": "1258",
    "name": "Theniet El Had",
    "ar_name": "ثنية الاحد",
    "wilaya_id": "38"
  },
  {
    "id": "1259",
    "name": "Lazharia",
    "ar_name": "الازھرية",
    "wilaya_id": "38"
  },
  {
    "id": "1260",
    "name": "Beni Chaib",
    "ar_name": "بنى شعيب",
    "wilaya_id": "38"
  },
  {
    "id": "1261",
    "name": "Lardjem",
    "ar_name": "لارجم",
    "wilaya_id": "38"
  },
  {
    "id": "1262",
    "name": "Melaab",
    "ar_name": "ملعب",
    "wilaya_id": "38"
  },
  {
    "id": "1263",
    "name": "Sidi Lantri",
    "ar_name": "سيدي العنترى",
    "wilaya_id": "38"
  },
  {
    "id": "1264",
    "name": "Bordj El Emir Abdelkader",
    "ar_name": "برج الامير عبد القادر",
    "wilaya_id": "38"
  },
  {
    "id": "1265",
    "name": "Layoune",
    "ar_name": "العيون",
    "wilaya_id": "38"
  },
  {
    "id": "1266",
    "name": "Khemisti",
    "ar_name": "خميستى",
    "wilaya_id": "38"
  },
  {
    "id": "1267",
    "name": "Ouled Bessem",
    "ar_name": "أولاد بسام",
    "wilaya_id": "38"
  },
  {
    "id": "1268",
    "name": "Ammari",
    "ar_name": "عمارى",
    "wilaya_id": "38"
  },
  {
    "id": "1269",
    "name": "Youssoufia",
    "ar_name": "اليوسفية",
    "wilaya_id": "38"
  },
  {
    "id": "1270",
    "name": "Sidi Boutouchent",
    "ar_name": "سيدي بوتوشنت",
    "wilaya_id": "38"
  },
  {
    "id": "1271",
    "name": "Larbaa",
    "ar_name": "الاربعاء",
    "wilaya_id": "38"
  },
  {
    "id": "1272",
    "name": "Maasem",
    "ar_name": "المعاصم",
    "wilaya_id": "38"
  },
  {
    "id": "1273",
    "name": "Sidi Abed",
    "ar_name": "سيدي عابد",
    "wilaya_id": "38"
  },
  {
    "id": "1274",
    "name": "Tamalaht",
    "ar_name": "تاملاحت",
    "wilaya_id": "38"
  },
  {
    "id": "1275",
    "name": "Sidi Slimane",
    "ar_name": "سيدي سليمان",
    "wilaya_id": "38"
  },
  {
    "id": "1276",
    "name": "Boucaid",
    "ar_name": "بوقايد",
    "wilaya_id": "38"
  },
  {
    "id": "1277",
    "name": "Beni Lahcene",
    "ar_name": "بنى لحسن",
    "wilaya_id": "38"
  },
  {
    "id": "1278",
    "name": "El Oued",
    "ar_name": "الوادي",
    "wilaya_id": "39"
  },
  {
    "id": "1279",
    "name": "Robbah",
    "ar_name": "رباح",
    "wilaya_id": "39"
  },
  {
    "id": "1280",
    "name": "Oued El Alenda",
    "ar_name": "وادى العلندة",
    "wilaya_id": "39"
  },
  {
    "id": "1281",
    "name": "Bayadha",
    "ar_name": "البياضة",
    "wilaya_id": "39"
  },
  {
    "id": "1282",
    "name": "Nakhla",
    "ar_name": "النخلة",
    "wilaya_id": "39"
  },
  {
    "id": "1283",
    "name": "Guemar",
    "ar_name": "ڨمار",
    "wilaya_id": "39"
  },
  {
    "id": "1284",
    "name": "Kouinine",
    "ar_name": "كوينين",
    "wilaya_id": "39"
  },
  {
    "id": "1285",
    "name": "Reguiba",
    "ar_name": "الرڨيبة",
    "wilaya_id": "39"
  },
  {
    "id": "1286",
    "name": "Hamraia",
    "ar_name": "الحمراية",
    "wilaya_id": "39"
  },
  {
    "id": "1287",
    "name": "Taghzout",
    "ar_name": "تغزوت",
    "wilaya_id": "39"
  },
  {
    "id": "1288",
    "name": "Debila",
    "ar_name": "الدبيلة",
    "wilaya_id": "39"
  },
  {
    "id": "1289",
    "name": "Hassani Abdelkrim",
    "ar_name": "بلدية حساني عبد الكريم",
    "wilaya_id": "39"
  },
  {
    "id": "1290",
    "name": "Hassi Khelifa",
    "ar_name": "حاسى خليفة",
    "wilaya_id": "39"
  },
  {
    "id": "1291",
    "name": "Taleb Larbi",
    "ar_name": "طالب العربي",
    "wilaya_id": "39"
  },
  {
    "id": "1292",
    "name": "Douar El Ma",
    "ar_name": "دوار الماء",
    "wilaya_id": "39"
  },
  {
    "id": "1293",
    "name": "Sidi Aoun",
    "ar_name": "سيدي عون",
    "wilaya_id": "39"
  },
  {
    "id": "1294",
    "name": "Trifaoui",
    "ar_name": "تريفاوى",
    "wilaya_id": "39"
  },
  {
    "id": "1295",
    "name": "Magrane",
    "ar_name": "المڨرن",
    "wilaya_id": "39"
  },
  {
    "id": "1296",
    "name": "Beni Guecha",
    "ar_name": "بن ڨشة",
    "wilaya_id": "39"
  },
  {
    "id": "1297",
    "name": "Ourmas",
    "ar_name": "أورماس",
    "wilaya_id": "39"
  },
  {
    "id": "1298",
    "name": "Still",
    "ar_name": "سطيل",
    "wilaya_id": "57"
  },
  {
    "id": "1299",
    "name": "Mrara",
    "ar_name": "مرارة",
    "wilaya_id": "39"
  },
  {
    "id": "1300",
    "name": "Sidi Khellil",
    "ar_name": "سيدي خليل",
    "wilaya_id": "39"
  },
  {
    "id": "1301",
    "name": "Tendla",
    "ar_name": "تندلة",
    "wilaya_id": "57"
  },
  {
    "id": "1302",
    "name": "El Ogla",
    "ar_name": "العقلة",
    "wilaya_id": "39"
  },
  {
    "id": "1303",
    "name": "Mih Ouansa",
    "ar_name": "مية ونسة",
    "wilaya_id": "39"
  },
  {
    "id": "1304",
    "name": "El Mghair",
    "ar_name": "المغير",
    "wilaya_id": "39"
  },
  {
    "id": "1305",
    "name": "Djamaa",
    "ar_name": "جامعة",
    "wilaya_id": "57"
  },
  {
    "id": "1306",
    "name": "Oum Touyour",
    "ar_name": "أم الطيور",
    "wilaya_id": "57"
  },
  {
    "id": "1307",
    "name": "Sidi Amrane",
    "ar_name": "سيدي عمران",
    "wilaya_id": "57"
  },
  {
    "id": "1308",
    "name": "Khenchela",
    "ar_name": "خنشلة",
    "wilaya_id": "40"
  },
  {
    "id": "1309",
    "name": "Mtoussa",
    "ar_name": "متوسة",
    "wilaya_id": "40"
  },
  {
    "id": "1310",
    "name": "Kais",
    "ar_name": "قايس",
    "wilaya_id": "40"
  },
  {
    "id": "1311",
    "name": "Baghai",
    "ar_name": "بغاي",
    "wilaya_id": "40"
  },
  {
    "id": "1312",
    "name": "El Hamma",
    "ar_name": "الحامة",
    "wilaya_id": "40"
  },
  {
    "id": "1313",
    "name": "Ain Touila",
    "ar_name": "عين الطويلة",
    "wilaya_id": "40"
  },
  {
    "id": "1314",
    "name": "Taouzianat",
    "ar_name": "تاوزيانت",
    "wilaya_id": "40"
  },
  {
    "id": "1315",
    "name": "Bouhmama",
    "ar_name": "بوحمامة",
    "wilaya_id": "40"
  },
  {
    "id": "1316",
    "name": "El Oueldja",
    "ar_name": "الولجة",
    "wilaya_id": "40"
  },
  {
    "id": "1317",
    "name": "Remila",
    "ar_name": "الرميلة",
    "wilaya_id": "40"
  },
  {
    "id": "1318",
    "name": "Cherchar",
    "ar_name": "ششار",
    "wilaya_id": "40"
  },
  {
    "id": "1319",
    "name": "Djellal",
    "ar_name": "جلال",
    "wilaya_id": "40"
  },
  {
    "id": "1320",
    "name": "Babar",
    "ar_name": "بابار",
    "wilaya_id": "40"
  },
  {
    "id": "1321",
    "name": "Tamza",
    "ar_name": "تامزة",
    "wilaya_id": "40"
  },
  {
    "id": "1322",
    "name": "Ensigha",
    "ar_name": "انسيغة",
    "wilaya_id": "40"
  },
  {
    "id": "1323",
    "name": "Ouled Rechache",
    "ar_name": "أولاد رشاش",
    "wilaya_id": "40"
  },
  {
    "id": "1324",
    "name": "El Mahmal",
    "ar_name": "المحمل",
    "wilaya_id": "40"
  },
  {
    "id": "1325",
    "name": "Msara",
    "ar_name": "أمصارة",
    "wilaya_id": "40"
  },
  {
    "id": "1326",
    "name": "Yabous",
    "ar_name": "يابوس",
    "wilaya_id": "40"
  },
  {
    "id": "1327",
    "name": "Khirane",
    "ar_name": "خيران",
    "wilaya_id": "40"
  },
  {
    "id": "1328",
    "name": "Chelia",
    "ar_name": "شلية",
    "wilaya_id": "40"
  },
  {
    "id": "1329",
    "name": "Souk Ahras",
    "ar_name": "سوق أهراس",
    "wilaya_id": "41"
  },
  {
    "id": "1330",
    "name": "Sedrata",
    "ar_name": "سدراتة",
    "wilaya_id": "41"
  },
  {
    "id": "1331",
    "name": "Hanancha",
    "ar_name": "الحنانشة",
    "wilaya_id": "41"
  },
  {
    "id": "1332",
    "name": "Mechroha",
    "ar_name": "المشروحة",
    "wilaya_id": "41"
  },
  {
    "id": "1333",
    "name": "Ouled Driss",
    "ar_name": "أولاد ادريس",
    "wilaya_id": "41"
  },
  {
    "id": "1334",
    "name": "Tiffech",
    "ar_name": "تيفاش",
    "wilaya_id": "41"
  },
  {
    "id": "1335",
    "name": "Zaarouria",
    "ar_name": "الزعرورية",
    "wilaya_id": "41"
  },
  {
    "id": "1336",
    "name": "Taoura",
    "ar_name": "تاورة",
    "wilaya_id": "41"
  },
  {
    "id": "1337",
    "name": "Drea",
    "ar_name": "الدريعة",
    "wilaya_id": "41"
  },
  {
    "id": "1338",
    "name": "Haddada",
    "ar_name": "الحدادة",
    "wilaya_id": "41"
  },
  {
    "id": "1339",
    "name": "Khedara",
    "ar_name": "لخضارة",
    "wilaya_id": "41"
  },
  {
    "id": "1340",
    "name": "Merahna",
    "ar_name": "المراهنة",
    "wilaya_id": "41"
  },
  {
    "id": "1341",
    "name": "Ouled Moumen",
    "ar_name": "أولاد مؤمن",
    "wilaya_id": "41"
  },
  {
    "id": "1342",
    "name": "Bir Bouhouche",
    "ar_name": "بئر بوحوش",
    "wilaya_id": "41"
  },
  {
    "id": "1343",
    "name": "Mdaourouche",
    "ar_name": "مداوروش",
    "wilaya_id": "41"
  },
  {
    "id": "1344",
    "name": "Oum El Adhaim",
    "ar_name": "أم العظائم",
    "wilaya_id": "41"
  },
  {
    "id": "1345",
    "name": "Ain Zana",
    "ar_name": "عين الزانة",
    "wilaya_id": "41"
  },
  {
    "id": "1346",
    "name": "Ain Soltane",
    "ar_name": "عين السلطان",
    "wilaya_id": "41"
  },
  {
    "id": "1347",
    "name": "Quillen",
    "ar_name": "ويلان",
    "wilaya_id": "41"
  },
  {
    "id": "1348",
    "name": "Sidi Fredj",
    "ar_name": "سيدي فرج",
    "wilaya_id": "41"
  },
  {
    "id": "1349",
    "name": "Safel El Ouiden",
    "ar_name": "سافل الويدان",
    "wilaya_id": "41"
  },
  {
    "id": "1350",
    "name": "Ragouba",
    "ar_name": "الرقوبة",
    "wilaya_id": "41"
  },
  {
    "id": "1351",
    "name": "Khemissa",
    "ar_name": "خميسة",
    "wilaya_id": "41"
  },
  {
    "id": "1352",
    "name": "Oued Keberit",
    "ar_name": "وادى الكبريت",
    "wilaya_id": "41"
  },
  {
    "id": "1353",
    "name": "Terraguelt",
    "ar_name": "ترقالت",
    "wilaya_id": "41"
  },
  {
    "id": "1354",
    "name": "Zouabi",
    "ar_name": "الزوابى",
    "wilaya_id": "41"
  },
  {
    "id": "1355",
    "name": "Tipaza",
    "ar_name": "تيبازة",
    "wilaya_id": "42"
  },
  {
    "id": "1356",
    "name": "Menaceur",
    "ar_name": "مناصر",
    "wilaya_id": "42"
  },
  {
    "id": "1357",
    "name": "Larhat",
    "ar_name": "الأرهاط",
    "wilaya_id": "42"
  },
  {
    "id": "1358",
    "name": "Douaouda",
    "ar_name": "دواودة",
    "wilaya_id": "42"
  },
  {
    "id": "1359",
    "name": "Bourkika",
    "ar_name": "بورقيقة",
    "wilaya_id": "42"
  },
  {
    "id": "1360",
    "name": "Khemisti",
    "ar_name": "خميستي",
    "wilaya_id": "42"
  },
  {
    "id": "1361",
    "name": "Aghabal",
    "ar_name": "أغابال",
    "wilaya_id": "42"
  },
  {
    "id": "1362",
    "name": "Hadjout",
    "ar_name": "حجوط",
    "wilaya_id": "42"
  },
  {
    "id": "1363",
    "name": "Sidi Amar",
    "ar_name": "سيدي عمر",
    "wilaya_id": "42"
  },
  {
    "id": "1364",
    "name": "Gouraya",
    "ar_name": "ڨورايا",
    "wilaya_id": "42"
  },
  {
    "id": "1365",
    "name": "Nodor",
    "ar_name": "الناظور",
    "wilaya_id": "42"
  },
  {
    "id": "1366",
    "name": "Chaiba",
    "ar_name": "الشعيبة",
    "wilaya_id": "42"
  },
  {
    "id": "1367",
    "name": "Ain Tagourait",
    "ar_name": "عين تڨورايت",
    "wilaya_id": "42"
  },
  {
    "id": "1368",
    "name": "Cherchel",
    "ar_name": "شرشال",
    "wilaya_id": "42"
  },
  {
    "id": "1369",
    "name": "Damous",
    "ar_name": "الداموس",
    "wilaya_id": "42"
  },
  {
    "id": "1370",
    "name": "Meurad",
    "ar_name": "مراد",
    "wilaya_id": "42"
  },
  {
    "id": "1371",
    "name": "Fouka",
    "ar_name": "فوكة",
    "wilaya_id": "42"
  },
  {
    "id": "1372",
    "name": "Bou Ismail",
    "ar_name": "بو اسماعيل",
    "wilaya_id": "42"
  },
  {
    "id": "1373",
    "name": "Ahmer El Ain",
    "ar_name": "أحمر العين",
    "wilaya_id": "42"
  },
  {
    "id": "1374",
    "name": "Bou Haroun",
    "ar_name": "بوهارون",
    "wilaya_id": "42"
  },
  {
    "id": "1375",
    "name": "Sidi Ghiles",
    "ar_name": "سيدي غيلاس",
    "wilaya_id": "42"
  },
  {
    "id": "1376",
    "name": "Messelmoun",
    "ar_name": "مسلمون",
    "wilaya_id": "42"
  },
  {
    "id": "1377",
    "name": "Sidi Rached",
    "ar_name": "سيدي راشد",
    "wilaya_id": "42"
  },
  {
    "id": "1378",
    "name": "Kolea",
    "ar_name": "القليعة",
    "wilaya_id": "42"
  },
  {
    "id": "1379",
    "name": "Attatba",
    "ar_name": "الحطاطبة",
    "wilaya_id": "42"
  },
  {
    "id": "1380",
    "name": "Sidi Semiane",
    "ar_name": "سيدي سميان",
    "wilaya_id": "42"
  },
  {
    "id": "1381",
    "name": "Beni Milleuk",
    "ar_name": "بني ميلك",
    "wilaya_id": "42"
  },
  {
    "id": "1382",
    "name": "Hadjerat Ennous",
    "ar_name": "حجرة النص",
    "wilaya_id": "42"
  },
  {
    "id": "1383",
    "name": "Mila",
    "ar_name": "ميلة",
    "wilaya_id": "43"
  },
  {
    "id": "1384",
    "name": "Ferdjioua",
    "ar_name": "فرجيوة",
    "wilaya_id": "43"
  },
  {
    "id": "1385",
    "name": "Chelghoum Laid",
    "ar_name": "شلغوم العيد",
    "wilaya_id": "43"
  },
  {
    "id": "1386",
    "name": "Oued Athmenia",
    "ar_name": "وادي العثمانية",
    "wilaya_id": "43"
  },
  {
    "id": "1387",
    "name": "Ain Mellouk",
    "ar_name": "عين ملوك",
    "wilaya_id": "43"
  },
  {
    "id": "1388",
    "name": "Telerghma",
    "ar_name": "تلاغمة",
    "wilaya_id": "43"
  },
  {
    "id": "1389",
    "name": "Oued Seguen",
    "ar_name": "وادى سقان",
    "wilaya_id": "43"
  },
  {
    "id": "1390",
    "name": "Tadjenanet",
    "ar_name": "تاجنانت",
    "wilaya_id": "43"
  },
  {
    "id": "1391",
    "name": "Benyahia Abderrahmane",
    "ar_name": "بن يحيى عبد الرحمان",
    "wilaya_id": "43"
  },
  {
    "id": "1392",
    "name": "Oued Endja",
    "ar_name": "وادى النجاء",
    "wilaya_id": "43"
  },
  {
    "id": "1393",
    "name": "Ahmed Rachedi",
    "ar_name": "أحمد راشدي",
    "wilaya_id": "43"
  },
  {
    "id": "1394",
    "name": "Ouled Khalouf",
    "ar_name": "أولاد خلوف",
    "wilaya_id": "43"
  },
  {
    "id": "1395",
    "name": "Tiberguent",
    "ar_name": "تيبرقنت",
    "wilaya_id": "43"
  },
  {
    "id": "1396",
    "name": "Bouhatem",
    "ar_name": "بوحاتم",
    "wilaya_id": "43"
  },
  {
    "id": "1397",
    "name": "Rouached",
    "ar_name": "رواشد",
    "wilaya_id": "43"
  },
  {
    "id": "1398",
    "name": "Tessala Lamatai",
    "ar_name": "تسالة لمطاي",
    "wilaya_id": "43"
  },
  {
    "id": "1399",
    "name": "Grarem Gouga",
    "ar_name": "القرارم قوقة",
    "wilaya_id": "43"
  },
  {
    "id": "1400",
    "name": "Sidi Merouane",
    "ar_name": "سيدي مروان",
    "wilaya_id": "43"
  },
  {
    "id": "1401",
    "name": "Tassadane Haddada",
    "ar_name": "تسدان حدادة",
    "wilaya_id": "43"
  },
  {
    "id": "1402",
    "name": "Derradji Bousselah",
    "ar_name": "دراحي بوصلاح",
    "wilaya_id": "43"
  },
  {
    "id": "1403",
    "name": "Minar Zarza",
    "ar_name": "مينار زرزة",
    "wilaya_id": "43"
  },
  {
    "id": "1404",
    "name": "Amira Arras",
    "ar_name": "عميرة أراس",
    "wilaya_id": "43"
  },
  {
    "id": "1405",
    "name": "Terrai Bainen",
    "ar_name": "ترعى بينان",
    "wilaya_id": "43"
  },
  {
    "id": "1406",
    "name": "Hamala",
    "ar_name": "حمالة",
    "wilaya_id": "43"
  },
  {
    "id": "1407",
    "name": "Ain Tine",
    "ar_name": "عين التين",
    "wilaya_id": "43"
  },
  {
    "id": "1408",
    "name": "El Mechira",
    "ar_name": "المشيرة",
    "wilaya_id": "43"
  },
  {
    "id": "1409",
    "name": "Sidi Khelifa",
    "ar_name": "سيدي خليفة",
    "wilaya_id": "43"
  },
  {
    "id": "1410",
    "name": "Zeghaia",
    "ar_name": "زغاية",
    "wilaya_id": "43"
  },
  {
    "id": "1411",
    "name": "Elayadi Barbes",
    "ar_name": "العياضى برباس",
    "wilaya_id": "43"
  },
  {
    "id": "1412",
    "name": "Ain Beida Harriche",
    "ar_name": "عين البيضاء حريش",
    "wilaya_id": "43"
  },
  {
    "id": "1413",
    "name": "Yahia Beniguecha",
    "ar_name": "يحيى بنى قشة",
    "wilaya_id": "43"
  },
  {
    "id": "1414",
    "name": "Chigara",
    "ar_name": "الشيقارة",
    "wilaya_id": "43"
  },
  {
    "id": "1415",
    "name": "Ain Defla",
    "ar_name": "عين دفلة - عين الدفلى",
    "wilaya_id": "44"
  },
  {
    "id": "1416",
    "name": "Miliana",
    "ar_name": "مليانة",
    "wilaya_id": "44"
  },
  {
    "id": "1417",
    "name": "Boumedfaa",
    "ar_name": "بومدفع",
    "wilaya_id": "44"
  },
  {
    "id": "1418",
    "name": "Khemis Miliana",
    "ar_name": "خميس مليانة",
    "wilaya_id": "44"
  },
  {
    "id": "1419",
    "name": "Hammam Righa",
    "ar_name": "حمام ريغة",
    "wilaya_id": "44"
  },
  {
    "id": "1420",
    "name": "Arib",
    "ar_name": "عريب",
    "wilaya_id": "44"
  },
  {
    "id": "1421",
    "name": "Djelida",
    "ar_name": "جليدة",
    "wilaya_id": "44"
  },
  {
    "id": "1422",
    "name": "El Amra",
    "ar_name": "العامرة",
    "wilaya_id": "44"
  },
  {
    "id": "1423",
    "name": "Bourached",
    "ar_name": "بوراشد",
    "wilaya_id": "44"
  },
  {
    "id": "1424",
    "name": "El Attaf",
    "ar_name": "العطاف",
    "wilaya_id": "44"
  },
  {
    "id": "1425",
    "name": "El Abadia",
    "ar_name": "العبادية",
    "wilaya_id": "44"
  },
  {
    "id": "1426",
    "name": "Djendel",
    "ar_name": "جندل",
    "wilaya_id": "44"
  },
  {
    "id": "1427",
    "name": "Oued Chorfa",
    "ar_name": "وادى الشرفاء",
    "wilaya_id": "44"
  },
  {
    "id": "1428",
    "name": "Ain Lechiakh",
    "ar_name": "عين االشياخ",
    "wilaya_id": "44"
  },
  {
    "id": "1429",
    "name": "Oued Djemaa",
    "ar_name": "وادى جمعة",
    "wilaya_id": "44"
  },
  {
    "id": "1430",
    "name": "Rouina",
    "ar_name": "روينة",
    "wilaya_id": "44"
  },
  {
    "id": "1431",
    "name": "Zeddine",
    "ar_name": "زدين",
    "wilaya_id": "44"
  },
  {
    "id": "1432",
    "name": "El Hassania",
    "ar_name": "الحسنية",
    "wilaya_id": "44"
  },
  {
    "id": "1433",
    "name": "Bir Ouled Khelifa",
    "ar_name": "بئر ولد خليفة",
    "wilaya_id": "44"
  },
  {
    "id": "1434",
    "name": "Ain Soltane",
    "ar_name": "عين السلطان",
    "wilaya_id": "44"
  },
  {
    "id": "1435",
    "name": "Tarik Ibn Ziad",
    "ar_name": "طارق بن زياد",
    "wilaya_id": "44"
  },
  {
    "id": "1436",
    "name": "Bordj Emir Khaled",
    "ar_name": "برج الأمير خالد",
    "wilaya_id": "44"
  },
  {
    "id": "1437",
    "name": "Ain Torki",
    "ar_name": "عين التركى",
    "wilaya_id": "44"
  },
  {
    "id": "1438",
    "name": "Sidi Lakhdar",
    "ar_name": "سيدي لخضر",
    "wilaya_id": "44"
  },
  {
    "id": "1439",
    "name": "Ben Allal",
    "ar_name": "بن علال",
    "wilaya_id": "44"
  },
  {
    "id": "1440",
    "name": "Ain Benian",
    "ar_name": "عين البنيان",
    "wilaya_id": "44"
  },
  {
    "id": "1441",
    "name": "Hoceinia",
    "ar_name": "حسينية",
    "wilaya_id": "44"
  },
  {
    "id": "1442",
    "name": "Barbouche",
    "ar_name": "بربوش",
    "wilaya_id": "44"
  },
  {
    "id": "1443",
    "name": "Djemaa Ouled Chikh",
    "ar_name": "جمعة أولاد الشيخ",
    "wilaya_id": "44"
  },
  {
    "id": "1444",
    "name": "Mekhatria",
    "ar_name": "المخاطرية",
    "wilaya_id": "44"
  },
  {
    "id": "1445",
    "name": "Bathia",
    "ar_name": "بطحية",
    "wilaya_id": "44"
  },
  {
    "id": "1446",
    "name": "Tachta Zegagha",
    "ar_name": "تاشتة زقاغة",
    "wilaya_id": "44"
  },
  {
    "id": "1447",
    "name": "Ain Bouyahia",
    "ar_name": "عين بويحى",
    "wilaya_id": "44"
  },
  {
    "id": "1448",
    "name": "El Maine",
    "ar_name": "الماين",
    "wilaya_id": "44"
  },
  {
    "id": "1449",
    "name": "Tiberkanine",
    "ar_name": "تبركانين",
    "wilaya_id": "44"
  },
  {
    "id": "1450",
    "name": "Belaas",
    "ar_name": "بالعاص",
    "wilaya_id": "44"
  },
  {
    "id": "1451",
    "name": "Naama",
    "ar_name": "النــعـامـة",
    "wilaya_id": "45"
  },
  {
    "id": "1452",
    "name": "Mechria",
    "ar_name": "مشرية",
    "wilaya_id": "45"
  },
  {
    "id": "1453",
    "name": "Ain Sefra",
    "ar_name": "عين الصفراء",
    "wilaya_id": "45"
  },
  {
    "id": "1454",
    "name": "Tiout",
    "ar_name": "تيوت",
    "wilaya_id": "45"
  },
  {
    "id": "1455",
    "name": "Sfissifa",
    "ar_name": "صفيصيفة",
    "wilaya_id": "45"
  },
  {
    "id": "1456",
    "name": "Moghrar",
    "ar_name": "مغرار",
    "wilaya_id": "45"
  },
  {
    "id": "1457",
    "name": "Assela",
    "ar_name": "عسلة",
    "wilaya_id": "45"
  },
  {
    "id": "1458",
    "name": "Djeniane Bourzeg",
    "ar_name": "جنين بورزق",
    "wilaya_id": "45"
  },
  {
    "id": "1459",
    "name": "Ain Ben Khelil",
    "ar_name": "عين بن خليل",
    "wilaya_id": "45"
  },
  {
    "id": "1460",
    "name": "Makman Ben Amer",
    "ar_name": "مكمن بن عمر",
    "wilaya_id": "45"
  },
  {
    "id": "1461",
    "name": "Kasdir",
    "ar_name": "قصدير",
    "wilaya_id": "45"
  },
  {
    "id": "1462",
    "name": "El Biod",
    "ar_name": "البيوض",
    "wilaya_id": "45"
  },
  {
    "id": "1463",
    "name": "Ain Temouchent",
    "ar_name": "عـيـن تـمـوشـنـت",
    "wilaya_id": "46"
  },
  {
    "id": "1464",
    "name": "Chaabet El Ham",
    "ar_name": "شعبة اللحم",
    "wilaya_id": "46"
  },
  {
    "id": "1465",
    "name": "Ain Kihal",
    "ar_name": "عين الكيحل",
    "wilaya_id": "46"
  },
  {
    "id": "1466",
    "name": "Hammam Bouhadjar",
    "ar_name": "حمام بو حجر",
    "wilaya_id": "46"
  },
  {
    "id": "1467",
    "name": "Bou Zedjar",
    "ar_name": "بوزجار",
    "wilaya_id": "46"
  },
  {
    "id": "1468",
    "name": "Oued Berkeche",
    "ar_name": "وادى برقش",
    "wilaya_id": "46"
  },
  {
    "id": "1469",
    "name": "Aghlal",
    "ar_name": "أغلال",
    "wilaya_id": "46"
  },
  {
    "id": "1470",
    "name": "Terga",
    "ar_name": "تارقة",
    "wilaya_id": "46"
  },
  {
    "id": "1471",
    "name": "Ain El Arbaa",
    "ar_name": "عين الاربعاء",
    "wilaya_id": "46"
  },
  {
    "id": "1472",
    "name": "Tamzoura",
    "ar_name": "تامزوغة",
    "wilaya_id": "46"
  },
  {
    "id": "1473",
    "name": "Chentouf",
    "ar_name": "شنتوف",
    "wilaya_id": "46"
  },
  {
    "id": "1474",
    "name": "Sidi Ben Adda",
    "ar_name": "سيدي بن عدة",
    "wilaya_id": "46"
  },
  {
    "id": "1475",
    "name": "Aoubellil",
    "ar_name": "عقب الليل",
    "wilaya_id": "46"
  },
  {
    "id": "1476",
    "name": "El Malah",
    "ar_name": "المالح",
    "wilaya_id": "46"
  },
  {
    "id": "1477",
    "name": "Sidi Boumediene",
    "ar_name": "سيدي بومدين",
    "wilaya_id": "46"
  },
  {
    "id": "1478",
    "name": "Oued Sabah",
    "ar_name": "وادى الصباح",
    "wilaya_id": "46"
  },
  {
    "id": "1479",
    "name": "Ouled Boudjemaa",
    "ar_name": "أولاد بوجمعة",
    "wilaya_id": "46"
  },
  {
    "id": "1480",
    "name": "Ain Tolba",
    "ar_name": "عين الطلبة",
    "wilaya_id": "46"
  },
  {
    "id": "1481",
    "name": "El Amria",
    "ar_name": "العامرية",
    "wilaya_id": "46"
  },
  {
    "id": "1482",
    "name": "Hassi El Ghella",
    "ar_name": "حاسى الغلة",
    "wilaya_id": "46"
  },
  {
    "id": "1483",
    "name": "Hassasna",
    "ar_name": "الحساسنة",
    "wilaya_id": "46"
  },
  {
    "id": "1484",
    "name": "Ouled Kihal",
    "ar_name": "أولاد الكيحل",
    "wilaya_id": "46"
  },
  {
    "id": "1485",
    "name": "Beni Saf",
    "ar_name": "بني صاف",
    "wilaya_id": "46"
  },
  {
    "id": "1486",
    "name": "Sidi Safi",
    "ar_name": "سيدي الصافي",
    "wilaya_id": "46"
  },
  {
    "id": "1487",
    "name": "Oulhaca El Gheraba",
    "ar_name": "ولهاصة الغرابة",
    "wilaya_id": "46"
  },
  {
    "id": "1488",
    "name": "Sidi Ouriache",
    "ar_name": "سيدي وريلش",
    "wilaya_id": "46"
  },
  {
    "id": "1489",
    "name": "El Emir Abdelkader",
    "ar_name": "الأمير عبد القادر",
    "wilaya_id": "46"
  },
  {
    "id": "1490",
    "name": "El Messaid",
    "ar_name": "المساعيد",
    "wilaya_id": "46"
  },
  {
    "id": "1491",
    "name": "Ghardaia",
    "ar_name": "غرداية",
    "wilaya_id": "47"
  },
  {
    "id": "1492",
    "name": "El Meniaa",
    "ar_name": "المنيعة",
    "wilaya_id": "47"
  },
  {
    "id": "1493",
    "name": "Dhayet Bendhahoua",
    "ar_name": "ضاية بن ضحوة",
    "wilaya_id": "47"
  },
  {
    "id": "1494",
    "name": "Berriane",
    "ar_name": "بريان",
    "wilaya_id": "47"
  },
  {
    "id": "1495",
    "name": "Metlili",
    "ar_name": "متليلي الشعانبة",
    "wilaya_id": "47"
  },
  {
    "id": "1496",
    "name": "El Guerrara",
    "ar_name": "الڨرارة",
    "wilaya_id": "47"
  },
  {
    "id": "1497",
    "name": "El Atteuf",
    "ar_name": "العطف",
    "wilaya_id": "47"
  },
  {
    "id": "1498",
    "name": "Zelfana",
    "ar_name": "زلفانة",
    "wilaya_id": "47"
  },
  {
    "id": "1499",
    "name": "Sebseb",
    "ar_name": "سبسب",
    "wilaya_id": "47"
  },
  {
    "id": "1500",
    "name": "Bounoura",
    "ar_name": "بونورة",
    "wilaya_id": "47"
  },
  {
    "id": "1501",
    "name": "Hassi Fehal",
    "ar_name": "حاسي الفحل",
    "wilaya_id": "58"
  },
  {
    "id": "1502",
    "name": "Hassi Gara",
    "ar_name": "حاسي قارة",
    "wilaya_id": "58"
  },
  {
    "id": "1503",
    "name": "Mansoura",
    "ar_name": "منصورة",
    "wilaya_id": "47"
  },
  {
    "id": "1504",
    "name": "Relizane",
    "ar_name": "غيليزان",
    "wilaya_id": "48"
  },
  {
    "id": "1505",
    "name": "Oued Rhiou",
    "ar_name": "وادي رهيو",
    "wilaya_id": "48"
  },
  {
    "id": "1506",
    "name": "Belaassel Bouzegza",
    "ar_name": "بلعسل بوزقزة",
    "wilaya_id": "48"
  },
  {
    "id": "1507",
    "name": "Sidi Saada",
    "ar_name": "سيدي سعادة",
    "wilaya_id": "48"
  },
  {
    "id": "1508",
    "name": "Ouled Aiche",
    "ar_name": "أولاد يعيش",
    "wilaya_id": "48"
  },
  {
    "id": "1509",
    "name": "Sidi Lazreg",
    "ar_name": "سيدي لزرق",
    "wilaya_id": "48"
  },
  {
    "id": "1510",
    "name": "El Hamadna",
    "ar_name": "الحمادنة",
    "wilaya_id": "48"
  },
  {
    "id": "1511",
    "name": "Sidi Mhamed Ben Ali",
    "ar_name": "سيدي امحمد بن علي",
    "wilaya_id": "48"
  },
  {
    "id": "1512",
    "name": "Mediouna",
    "ar_name": "مديونة",
    "wilaya_id": "48"
  },
  {
    "id": "1513",
    "name": "Sidi Khettab",
    "ar_name": "سيدي خطاب",
    "wilaya_id": "48"
  },
  {
    "id": "1514",
    "name": "Ammi Moussa",
    "ar_name": "عمي موسى",
    "wilaya_id": "48"
  },
  {
    "id": "1515",
    "name": "Zemmoura",
    "ar_name": "زمورة",
    "wilaya_id": "48"
  },
  {
    "id": "1516",
    "name": "Beni Dergoun",
    "ar_name": "بني درقن",
    "wilaya_id": "48"
  },
  {
    "id": "1517",
    "name": "Djidiouia",
    "ar_name": "جيديوة",
    "wilaya_id": "48"
  },
  {
    "id": "1518",
    "name": "El Guettar",
    "ar_name": "القطارة",
    "wilaya_id": "48"
  },
  {
    "id": "1519",
    "name": "Hamri",
    "ar_name": "الحمري",
    "wilaya_id": "48"
  },
  {
    "id": "1520",
    "name": "El Matmar",
    "ar_name": "المطمار",
    "wilaya_id": "48"
  },
  {
    "id": "1521",
    "name": "Sidi Mhamed Ben Aouda",
    "ar_name": "سيدي بن عودة",
    "wilaya_id": "48"
  },
  {
    "id": "1522",
    "name": "Ain Tarek",
    "ar_name": "عين طارق",
    "wilaya_id": "48"
  },
  {
    "id": "1523",
    "name": "Oued Essalem",
    "ar_name": "وادي السلام",
    "wilaya_id": "48"
  },
  {
    "id": "1524",
    "name": "Ouarizane",
    "ar_name": "ﻭﺍﺭﻳﺯﺍﻥ",
    "wilaya_id": "48"
  },
  {
    "id": "1525",
    "name": "Mazouna",
    "ar_name": "مازونة",
    "wilaya_id": "48"
  },
  {
    "id": "1526",
    "name": "Kalaa",
    "ar_name": "قلعة",
    "wilaya_id": "48"
  },
  {
    "id": "1527",
    "name": "Ain Rahma",
    "ar_name": "عين الرحمة",
    "wilaya_id": "48"
  },
  {
    "id": "1528",
    "name": "Yellel",
    "ar_name": "يلل",
    "wilaya_id": "48"
  },
  {
    "id": "1529",
    "name": "Oued El Djemaa",
    "ar_name": "وادى الجمعة",
    "wilaya_id": "48"
  },
  {
    "id": "1530",
    "name": "Ramka",
    "ar_name": "رمكة",
    "wilaya_id": "48"
  },
  {
    "id": "1531",
    "name": "Mendes",
    "ar_name": "مندس",
    "wilaya_id": "48"
  },
  {
    "id": "1532",
    "name": "Lahlef",
    "ar_name": "لحلاف",
    "wilaya_id": "48"
  },
  {
    "id": "1533",
    "name": "Beni Zentis",
    "ar_name": "بني زنتيس",
    "wilaya_id": "48"
  },
  {
    "id": "1534",
    "name": "Souk El Haad",
    "ar_name": "سوق الحد",
    "wilaya_id": "48"
  },
  {
    "id": "1535",
    "name": "Dar Ben Abdellah",
    "ar_name": "دار بن عبد الله",
    "wilaya_id": "48"
  },
  {
    "id": "1536",
    "name": "El Hassi",
    "ar_name": "الحاسى",
    "wilaya_id": "48"
  },
  {
    "id": "1537",
    "name": "Had Echkalla",
    "ar_name": "حد الشقالة",
    "wilaya_id": "48"
  },
  {
    "id": "1538",
    "name": "Bendaoud",
    "ar_name": "بن داود",
    "wilaya_id": "48"
  },
  {
    "id": "1539",
    "name": "El Ouldja",
    "ar_name": "العلجة",
    "wilaya_id": "48"
  },
  {
    "id": "1540",
    "name": "Merdja Sidi Abed",
    "ar_name": "مرجة سيدي عابد",
    "wilaya_id": "48"
  },
  {
    "id": "1541",
    "name": "Ouled Sidi Mihoub",
    "ar_name": "أولاد سيدي ميهوب",
    "wilaya_id": "48"
  },
  {
    "id": "1542",
    "name": "Timimoun",
    "ar_name": "تيميمون",
    "wilaya_id": "49"
  },
  {
    "id": "1543",
    "name": "Ouled Said",
    "ar_name": "أولاد سعيد",
    "wilaya_id": "49"
  },
  {
    "id": "1544",
    "name": "Aougrout",
    "ar_name": "أوقروت",
    "wilaya_id": "49"
  },
  {
    "id": "1545",
    "name": "Deldoul",
    "ar_name": "دلدول",
    "wilaya_id": "49"
  },
  {
    "id": "1546",
    "name": "Metarfa",
    "ar_name": "المطارفة",
    "wilaya_id": "49"
  },
  {
    "id": "1547",
    "name": "Tinerkouk",
    "ar_name": "تينركوك",
    "wilaya_id": "49"
  },
  {
    "id": "1548",
    "name": "Ksar Kaddour",
    "ar_name": "قصر قدور",
    "wilaya_id": "49"
  },
  {
    "id": "1549",
    "name": "Charouine",
    "ar_name": "شروين",
    "wilaya_id": "49"
  },
  {
    "id": "1550",
    "name": "Talmine",
    "ar_name": "طالمين",
    "wilaya_id": "49"
  },
  {
    "id": "1551",
    "name": "Ouled Aissa",
    "ar_name": "أولاد عيسى",
    "wilaya_id": "49"
  },
  {
    "id": "1552",
    "name": "Bordj Badji Mokhtar",
    "ar_name": "برج باجي مختار",
    "wilaya_id": "50"
  },
  {
    "id": "1553",
    "name": "Timiaouine",
    "ar_name": "تيمياوين",
    "wilaya_id": "50"
  },
  {
    "id": "1554",
    "name": "Ouled Djellal",
    "ar_name": "أولاد جلال",
    "wilaya_id": "51"
  },
  {
    "id": "1555",
    "name": "Sidi Khaled",
    "ar_name": "سيدي خالد",
    "wilaya_id": "51"
  },
  {
    "id": "1556",
    "name": "Ras El Miad",
    "ar_name": "راس الميعاد",
    "wilaya_id": "51"
  },
  {
    "id": "1557",
    "name": "Besbes",
    "ar_name": "البسباس",
    "wilaya_id": "51"
  },
  {
    "id": "1558",
    "name": "Chaiba",
    "ar_name": "الشعيبة",
    "wilaya_id": "51"
  },
  {
    "id": "1559",
    "name": "Doucen",
    "ar_name": "الدوسن",
    "wilaya_id": "51"
  },
  {
    "id": "1560",
    "name": "Beni Abbes",
    "ar_name": "بني عباس",
    "wilaya_id": "52"
  },
  {
    "id": "1561",
    "name": "Tamtert",
    "ar_name": "تامترت",
    "wilaya_id": "52"
  },
  {
    "id": "1562",
    "name": "Kerzaz",
    "ar_name": "كرزاز",
    "wilaya_id": "52"
  },
  {
    "id": "1563",
    "name": "Timoudi",
    "ar_name": "تيمودي",
    "wilaya_id": "52"
  },
  {
    "id": "1564",
    "name": "Beni Ikhlef",
    "ar_name": "بني يخلف",
    "wilaya_id": "52"
  },
  {
    "id": "1565",
    "name": "El Ouata",
    "ar_name": "الوطاء",
    "wilaya_id": "52"
  },
  {
    "id": "1566",
    "name": "Tabelbala",
    "ar_name": "تبلبلة",
    "wilaya_id": "52"
  },
  {
    "id": "1567",
    "name": "Ouled Khoudir",
    "ar_name": "أولاد خضير",
    "wilaya_id": "52"
  },
  {
    "id": "1568",
    "name": "Ksabi",
    "ar_name": "قصابي",
    "wilaya_id": "52"
  },
  {
    "id": "1569",
    "name": "Igli",
    "ar_name": "أقلي",
    "wilaya_id": "52"
  },
  {
    "id": "1570",
    "name": "In Salah",
    "ar_name": "إن صالح",
    "wilaya_id": "53"
  },
  {
    "id": "1571",
    "name": "Foggaret Ezzaouia",
    "ar_name": "فقارة الزاوية",
    "wilaya_id": "53"
  },
  {
    "id": "1572",
    "name": "In Ghar",
    "ar_name": "إن غار",
    "wilaya_id": "53"
  },
  {
    "id": "1573",
    "name": "In Guezzam",
    "ar_name": "إن قزام",
    "wilaya_id": "54"
  },
  {
    "id": "1574",
    "name": "Tin Zaouatine",
    "ar_name": "تين زواتين",
    "wilaya_id": "54"
  },
  {
    "id": "1575",
    "name": "Touggourt",
    "ar_name": "توقرت",
    "wilaya_id": "55"
  },
  {
    "id": "1576",
    "name": "Nezla",
    "ar_name": "نزلة",
    "wilaya_id": "55"
  },
  {
    "id": "1577",
    "name": "Tebesbest",
    "ar_name": "تبسبست",
    "wilaya_id": "55"
  },
  {
    "id": "1578",
    "name": "Zaouia El Abidia",
    "ar_name": "الزاوية العابدية",
    "wilaya_id": "55"
  },
  {
    "id": "1579",
    "name": "Temacine",
    "ar_name": "تماسين",
    "wilaya_id": "55"
  },
  {
    "id": "1580",
    "name": "Blidet Amor",
    "ar_name": "بلدة عمر",
    "wilaya_id": "55"
  },
  {
    "id": "1581",
    "name": "Megarine",
    "ar_name": "المقارين",
    "wilaya_id": "55"
  },
  {
    "id": "1582",
    "name": "Sidi Slimane",
    "ar_name": "سيدي سليمان",
    "wilaya_id": "55"
  },
  {
    "id": "1583",
    "name": "Taibet",
    "ar_name": "الطيبات",
    "wilaya_id": "55"
  },
  {
    "id": "1584",
    "name": "Benaceur",
    "ar_name": "بن ناصر",
    "wilaya_id": "55"
  },
  {
    "id": "1585",
    "name": "Mnaguer",
    "ar_name": "المنقر",
    "wilaya_id": "55"
  },
  {
    "id": "1586",
    "name": "Hadjira",
    "ar_name": "الحجيرة",
    "wilaya_id": "55"
  },
  {
    "id": "1587",
    "name": "El Allia",
    "ar_name": "العالية",
    "wilaya_id": "55"
  },
  {
    "id": "1588",
    "name": "Djanet",
    "ar_name": "جانت",
    "wilaya_id": "56"
  },
  {
    "id": "1589",
    "name": "Bordj El Haouas",
    "ar_name": "برج الحواس",
    "wilaya_id": "56"
  },
  {
    "id": "1590",
    "name": "El M'Ghair",
    "ar_name": "المغير",
    "wilaya_id": "57"
  },
  {
    "id": "1591",
    "name": "Oum Touyour",
    "ar_name": "أم الطيور",
    "wilaya_id": "57"
  },
  {
    "id": "1592",
    "name": "Sidi Khelil",
    "ar_name": "سيدي خليل",
    "wilaya_id": "57"
  },
  {
    "id": "1593",
    "name": "Still",
    "ar_name": "سطيل",
    "wilaya_id": "57"
  },
  {
    "id": "1594",
    "name": "Djamaa",
    "ar_name": "جامعة",
    "wilaya_id": "57"
  },
  {
    "id": "1595",
    "name": "Sidi Amrane",
    "ar_name": "سيدي عمران",
    "wilaya_id": "57"
  },
  {
    "id": "1596",
    "name": "Tenedla",
    "ar_name": "تندلة",
    "wilaya_id": "57"
  },
  {
    "id": "1597",
    "name": "M'Rara",
    "ar_name": "مرارة",
    "wilaya_id": "57"
  },
  {
    "id": "1598",
    "name": "El Meniaa",
    "ar_name": "المنيعة",
    "wilaya_id": "58"
  },
  {
    "id": "1599",
    "name": "Hassi Gara",
    "ar_name": "حاسي القارة",
    "wilaya_id": "58"
  },
  {
    "id": "1600",
    "name": "Hassi Fehal",
    "ar_name": "حاسي الفحل",
    "wilaya_id": "58"
  },
  {
    "id": "1601",
    "name": "Aflou",
    "ar_name": "آفلو",
    "wilaya_id": "59"
  },
  {
    "id": "1602",
    "name": "Gueltat Sidi Saad",
    "ar_name": "قلتة سيدي سعد",
    "wilaya_id": "59"
  },
  {
    "id": "1603",
    "name": "Ain Sidi Ali",
    "ar_name": "عين سيدي علي",
    "wilaya_id": "59"
  },
  {
    "id": "1604",
    "name": "Beidha",
    "ar_name": "بيضاء",
    "wilaya_id": "59"
  },
  {
    "id": "1605",
    "name": "Brida",
    "ar_name": "بريدة",
    "wilaya_id": "59"
  },
  {
    "id": "1606",
    "name": "El Ghicha",
    "ar_name": "الغيشة",
    "wilaya_id": "59"
  },
  {
    "id": "1607",
    "name": "Hadj Mechri",
    "ar_name": "الحاج المشري",
    "wilaya_id": "59"
  },
  {
    "id": "1608",
    "name": "Sebgag",
    "ar_name": "سبقاق",
    "wilaya_id": "59"
  },
  {
    "id": "1609",
    "name": "Taouiala",
    "ar_name": "تاويالة",
    "wilaya_id": "59"
  },
  {
    "id": "1610",
    "name": "Oued Morra",
    "ar_name": "وادي مرة",
    "wilaya_id": "59"
  },
  {
    "id": "1611",
    "name": "Oued M'Zi",
    "ar_name": "وادي مزي",
    "wilaya_id": "59"
  },
  {
    "id": "1612",
    "name": "Sidi Bouzid",
    "ar_name": "سيدي بوزيد",
    "wilaya_id": "59"
  },
  {
    "id": "1613",
    "name": "Barika",
    "ar_name": "بريكة",
    "wilaya_id": "60"
  },
  {
    "id": "1614",
    "name": "Bitam",
    "ar_name": "بيطام",
    "wilaya_id": "60"
  },
  {
    "id": "1615",
    "name": "Abdelkader Azil",
    "ar_name": "عبد القادر عزيل",
    "wilaya_id": "60"
  },
  {
    "id": "1616",
    "name": "Tilatou",
    "ar_name": "تيلاطو",
    "wilaya_id": "60"
  },
  {
    "id": "1617",
    "name": "Seggana",
    "ar_name": "سقانة",
    "wilaya_id": "60"
  },
  {
    "id": "1618",
    "name": "El Djazzar",
    "ar_name": "الجزار",
    "wilaya_id": "60"
  },
  {
    "id": "1619",
    "name": "Mdoukal",
    "ar_name": "مدوكل",
    "wilaya_id": "60"
  },
  {
    "id": "1620",
    "name": "Ouled Ammar",
    "ar_name": "أولاد عمار",
    "wilaya_id": "60"
  },
  {
    "id": "1621",
    "name": "El Kantara",
    "ar_name": "القنطرة",
    "wilaya_id": "61"
  },
  {
    "id": "1622",
    "name": "Ain Zaatout",
    "ar_name": "عين زعطوط",
    "wilaya_id": "61"
  },
  {
    "id": "1623",
    "name": "Branis",
    "ar_name": "البرانس",
    "wilaya_id": "61"
  },
  {
    "id": "1624",
    "name": "El Outaya",
    "ar_name": "الوطاية",
    "wilaya_id": "61"
  },
  {
    "id": "1625",
    "name": "Djemourah",
    "ar_name": "جمورة",
    "wilaya_id": "61"
  },
  {
    "id": "1626",
    "name": "Bir El Ater",
    "ar_name": "بئر العاتر",
    "wilaya_id": "62"
  },
  {
    "id": "1627",
    "name": "Negrine",
    "ar_name": "نقرين",
    "wilaya_id": "62"
  },
  {
    "id": "1628",
    "name": "Ogla Melha",
    "ar_name": "العقلة المالحة",
    "wilaya_id": "62"
  },
  {
    "id": "1629",
    "name": "Ferkane",
    "ar_name": "فركان",
    "wilaya_id": "62"
  },
  {
    "id": "1630",
    "name": "El Aricha",
    "ar_name": "العريشة",
    "wilaya_id": "63"
  },
  {
    "id": "1631",
    "name": "El Gor",
    "ar_name": "القور",
    "wilaya_id": "63"
  },
  {
    "id": "1632",
    "name": "Sidi Djillali",
    "ar_name": "سيدي الجيلالي",
    "wilaya_id": "63"
  },
  {
    "id": "1633",
    "name": "El Bouihi",
    "ar_name": "البويهي",
    "wilaya_id": "63"
  },
  {
    "id": "1634",
    "name": "Ksar Chellala",
    "ar_name": "قصر الشلالة",
    "wilaya_id": "64"
  },
  {
    "id": "1635",
    "name": "Zmalet El Emir Abdelkader",
    "ar_name": "زمالة الأمير عبد القادر",
    "wilaya_id": "64"
  },
  {
    "id": "1636",
    "name": "Rechaiga",
    "ar_name": "الرشايقة",
    "wilaya_id": "64"
  },
  {
    "id": "1637",
    "name": "Hamadia",
    "ar_name": "الحمادية",
    "wilaya_id": "64"
  },
  {
    "id": "1638",
    "name": "Serghine",
    "ar_name": "سرغين",
    "wilaya_id": "64"
  },
  {
    "id": "1639",
    "name": "Bougara",
    "ar_name": "بوقرة",
    "wilaya_id": "64"
  },
  {
    "id": "1640",
    "name": "Ain Oussera",
    "ar_name": "عين وسارة",
    "wilaya_id": "65"
  },
  {
    "id": "1641",
    "name": "Birine",
    "ar_name": "بيرين",
    "wilaya_id": "65"
  },
  {
    "id": "1642",
    "name": "Bouira Lahdab",
    "ar_name": "بويرة الأحدب",
    "wilaya_id": "65"
  },
  {
    "id": "1643",
    "name": "El Khemis",
    "ar_name": "الخميس",
    "wilaya_id": "65"
  },
  {
    "id": "1644",
    "name": "Sidi Ladjel",
    "ar_name": "سيدي لعجال",
    "wilaya_id": "65"
  },
  {
    "id": "1645",
    "name": "Had Sahary",
    "ar_name": "حد الصحاري",
    "wilaya_id": "65"
  },
  {
    "id": "1646",
    "name": "Guernini",
    "ar_name": "قرنيني",
    "wilaya_id": "65"
  },
  {
    "id": "1647",
    "name": "Benhar",
    "ar_name": "بن هار",
    "wilaya_id": "65"
  },
  {
    "id": "1648",
    "name": "Hassi Fedoul",
    "ar_name": "حاسي فدول",
    "wilaya_id": "65"
  },
  {
    "id": "1649",
    "name": "Ain Fekka",
    "ar_name": "عين فكة",
    "wilaya_id": "65"
  },
  {
    "id": "1650",
    "name": "Messad",
    "ar_name": "مسعد",
    "wilaya_id": "66"
  },
  {
    "id": "1651",
    "name": "Sed Rahal",
    "ar_name": "سد الرحال",
    "wilaya_id": "66"
  },
  {
    "id": "1652",
    "name": "Faydh El Botma",
    "ar_name": "فيض البطمة",
    "wilaya_id": "66"
  },
  {
    "id": "1653",
    "name": "Guettara",
    "ar_name": "القطارة",
    "wilaya_id": "66"
  },
  {
    "id": "1654",
    "name": "Selmana",
    "ar_name": "سلمانة",
    "wilaya_id": "66"
  },
  {
    "id": "1655",
    "name": "Amourah",
    "ar_name": "عمورة",
    "wilaya_id": "66"
  },
  {
    "id": "1656",
    "name": "Deldoul",
    "ar_name": "دلدول",
    "wilaya_id": "66"
  },
  {
    "id": "1657",
    "name": "Om El Adham",
    "ar_name": "أم العظام",
    "wilaya_id": "66"
  },
  {
    "id": "1658",
    "name": "Ksar El Boukhari",
    "ar_name": "قصر البخاري",
    "wilaya_id": "67"
  },
  {
    "id": "1659",
    "name": "Ouled Maaref",
    "ar_name": "أولاد معرف",
    "wilaya_id": "67"
  },
  {
    "id": "1660",
    "name": "Ain Boucif",
    "ar_name": "عين بوسيف",
    "wilaya_id": "67"
  },
  {
    "id": "1661",
    "name": "Derrag",
    "ar_name": "دراق",
    "wilaya_id": "67"
  },
  {
    "id": "1662",
    "name": "Bouaiche",
    "ar_name": "بوعيش",
    "wilaya_id": "67"
  },
  {
    "id": "1663",
    "name": "Kef Lakhdar",
    "ar_name": "الكاف الأخضر",
    "wilaya_id": "67"
  },
  {
    "id": "1664",
    "name": "Chellalet El Adhaoura",
    "ar_name": "شلالة العذاورة",
    "wilaya_id": "67"
  },
  {
    "id": "1665",
    "name": "Ouled Hellal",
    "ar_name": "أولاد هلال",
    "wilaya_id": "67"
  },
  {
    "id": "1666",
    "name": "Tafraout",
    "ar_name": "تفراوت",
    "wilaya_id": "67"
  },
  {
    "id": "1667",
    "name": "Boghar",
    "ar_name": "بوغار",
    "wilaya_id": "67"
  },
  {
    "id": "1668",
    "name": "Sidi Damed",
    "ar_name": "سيدي دامد",
    "wilaya_id": "67"
  },
  {
    "id": "1669",
    "name": "Aziz",
    "ar_name": "عزيز",
    "wilaya_id": "67"
  },
  {
    "id": "1670",
    "name": "Chahbounia",
    "ar_name": "الشهبونية",
    "wilaya_id": "67"
  },
  {
    "id": "1671",
    "name": "Cheniguel",
    "ar_name": "شنيقل",
    "wilaya_id": "67"
  },
  {
    "id": "1672",
    "name": "Ain El Kessir",
    "ar_name": "عين القصير",
    "wilaya_id": "67"
  },
  {
    "id": "1673",
    "name": "Oum El Djellil",
    "ar_name": "أم الجليل",
    "wilaya_id": "67"
  },
  {
    "id": "1674",
    "name": "M'fatha",
    "ar_name": "مفاتحة",
    "wilaya_id": "67"
  },
  {
    "id": "1675",
    "name": "Boughezoul",
    "ar_name": "بوغزول",
    "wilaya_id": "67"
  },
  {
    "id": "1676",
    "name": "El Ouinet",
    "ar_name": "العوينات",
    "wilaya_id": "67"
  },
  {
    "id": "1677",
    "name": "Ouled Antar",
    "ar_name": "أولاد عنتر",
    "wilaya_id": "67"
  },
  {
    "id": "1678",
    "name": "Saneg",
    "ar_name": "السانق",
    "wilaya_id": "67"
  },
  {
    "id": "1679",
    "name": "Bou Saada",
    "ar_name": "بوسعادة",
    "wilaya_id": "68"
  },
  {
    "id": "1680",
    "name": "El Hamel",
    "ar_name": "الهامل",
    "wilaya_id": "68"
  },
  {
    "id": "1681",
    "name": "Oultene",
    "ar_name": "ولتام",
    "wilaya_id": "68"
  },
  {
    "id": "1682",
    "name": "Khoubana",
    "ar_name": "خبانة",
    "wilaya_id": "68"
  },
  {
    "id": "1683",
    "name": "M'Sif",
    "ar_name": "مسيف",
    "wilaya_id": "68"
  },
  {
    "id": "1684",
    "name": "Houamed",
    "ar_name": "الحوامد",
    "wilaya_id": "68"
  },
  {
    "id": "1685",
    "name": "Ben Srour",
    "ar_name": "بن سرور",
    "wilaya_id": "68"
  },
  {
    "id": "1686",
    "name": "Ouled Slimane",
    "ar_name": "أولاد سليمان",
    "wilaya_id": "68"
  },
  {
    "id": "1687",
    "name": "Zarzour",
    "ar_name": "الزرزور",
    "wilaya_id": "68"
  },
  {
    "id": "1688",
    "name": "Mohammed Boudiaf",
    "ar_name": "محمد بوضياف",
    "wilaya_id": "68"
  },
  {
    "id": "1689",
    "name": "Ain El Melh",
    "ar_name": "عين الملح",
    "wilaya_id": "68"
  },
  {
    "id": "1690",
    "name": "Bir El Fodda",
    "ar_name": "بير الفضة",
    "wilaya_id": "68"
  },
  {
    "id": "1691",
    "name": "Ain Fares",
    "ar_name": "عين فارس",
    "wilaya_id": "68"
  },
  {
    "id": "1692",
    "name": "Sidi M'hamed",
    "ar_name": "سيدي امحمد",
    "wilaya_id": "68"
  },
  {
    "id": "1693",
    "name": "Ain Rich",
    "ar_name": "عين الريش",
    "wilaya_id": "68"
  },
  {
    "id": "1694",
    "name": "Amjedel",
    "ar_name": "أمجدل",
    "wilaya_id": "68"
  },
  {
    "id": "1695",
    "name": "Ouled Atia",
    "ar_name": "أولاد عطية",
    "wilaya_id": "68"
  },
  {
    "id": "1696",
    "name": "Djebel M'saad",
    "ar_name": "جبل أمساعد",
    "wilaya_id": "68"
  },
  {
    "id": "1697",
    "name": "Slim",
    "ar_name": "سليم",
    "wilaya_id": "68"
  },
  {
    "id": "1698",
    "name": "Sidi Ameur",
    "ar_name": "سيدي عامر",
    "wilaya_id": "68"
  },
  {
    "id": "1699",
    "name": "Tamsa",
    "ar_name": "تامسة",
    "wilaya_id": "68"
  },
  {
    "id": "1700",
    "name": "Ouled Sidi Brahim",
    "ar_name": "أولاد سيدي إبراهيم",
    "wilaya_id": "68"
  },
  {
    "id": "1701",
    "name": "Benzouh",
    "ar_name": "بنزوه",
    "wilaya_id": "68"
  },
  {
    "id": "1702",
    "name": "El Abiodh Sidi Cheikh",
    "ar_name": "الأبيض سيدي الشيخ",
    "wilaya_id": "69"
  },
  {
    "id": "1703",
    "name": "Ain El Orak",
    "ar_name": "عين العراك",
    "wilaya_id": "69"
  },
  {
    "id": "1704",
    "name": "Arbaouat",
    "ar_name": "عرباوة",
    "wilaya_id": "69"
  },
  {
    "id": "1705",
    "name": "Boussemghoun",
    "ar_name": "بوسمغون",
    "wilaya_id": "69"
  },
  {
    "id": "1706",
    "name": "Chellala",
    "ar_name": "شلالة",
    "wilaya_id": "69"
  },
  {
    "id": "1707",
    "name": "El Bnoud",
    "ar_name": "البنود",
    "wilaya_id": "69"
  },
  {
    "id": "1708",
    "name": "El Mahra",
    "ar_name": "المهرة",
    "wilaya_id": "69"
  }
];
