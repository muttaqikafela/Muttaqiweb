import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Globe,
  Search,
  ExternalLink,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Compass,
  X
} from 'lucide-react';

type VisaRegion = 'all' | 'middle_east' | 'asia' | 'europe' | 'americas_oceania' | 'global';

interface VisaPortalItem {
  id: string;
  countryBn: string;
  countryEn: string;
  flag: string;
  region: Exclude<VisaRegion, 'all'>;
  portalName: string;
  domain: string;
  url: string;
  noteBn: string;
  keywords: string;
  featuredSaudi?: boolean;
}

const ALL_VISA_PORTALS: VisaPortalItem[] = [
  // Featured Saudi Arabia Official Portals (First slides in carousel)
  {
    id: 'saudi-mofa',
    countryBn: 'সৌদি আরব (MOFA ভিসা চেক)',
    countryEn: 'Saudi Arabia — MOFA Enjaz',
    flag: '🇸🇦',
    region: 'middle_east',
    portalName: 'Ministry of Foreign Affairs (MOFA)',
    domain: 'visa.mofa.gov.sa',
    url: 'https://visa.mofa.gov.sa',
    noteBn: 'হজ্ব, ওমরাহ, ওয়ার্ক, ফ্যামিলি ও ভিজিট ভিসা পাসপোর্ট বা ভিসা নম্বর দিয়ে যাচাই করুন',
    keywords: 'saudi arabia ksa mofa enjaz hajj umrah work visit সৌদি আরব হজ ওমরাহ ভিসা',
    featuredSaudi: true
  },
  {
    id: 'saudi-ksavisa',
    countryBn: 'সৌদি আরব (KSA ন্যাশনাল ভিসা)',
    countryEn: 'Saudi Arabia — Unified KSA Visa',
    flag: '🇸🇦',
    region: 'middle_east',
    portalName: 'KSA Unified Visa Platform',
    domain: 'ksavisa.sa',
    url: 'https://ksavisa.sa',
    noteBn: 'সৌদি ই-ভিসা ও অ্যাপ্লিকেশন স্ট্যাটাস অনলাইনে সরাসরি ট্র্যাক করুন',
    keywords: 'saudi ksavisa evisa track application সৌদি ই-ভিসা ট্র্যাক',
    featuredSaudi: true
  },
  {
    id: 'saudi-muqeem',
    countryBn: 'সৌদি আরব (মুকিম / মেয়াদ যাচাই)',
    countryEn: 'Saudi Arabia — Muqeem Validity',
    flag: '🇸🇦',
    region: 'middle_east',
    portalName: 'Muqeem Portal',
    domain: 'muqeem.sa',
    url: 'https://muqeem.sa',
    noteBn: 'এক্সিট/রি-এন্ট্রি ভিসা, ইকামা ও ভিসার বৈধতা/মেয়াদ চেক করুন',
    keywords: 'saudi muqeem iqama exit re-entry validity মুকিম ইকামা ছুটির ভিসা',
    featuredSaudi: true
  },

  // Middle East
  {
    id: 'uae-dubai',
    countryBn: 'সংযুক্ত আরব আমিরাত (দুবাই)',
    countryEn: 'UAE — Dubai (GDRFA)',
    flag: '🇦🇪',
    region: 'middle_east',
    portalName: 'GDRFA Dubai Smart Portal',
    domain: 'smart.gdrfad.gov.ae',
    url: 'https://smart.gdrfad.gov.ae/',
    noteBn: 'দুবাই ইস্যুকৃত ভিজিট, ওয়ার্ক ও রেসিডেন্স ভিসা যাচাই করুন',
    keywords: 'uae dubai gdrfa emirates দুবাই আরব আমিরাত'
  },
  {
    id: 'uae-icp',
    countryBn: 'আরব আমিরাত (আবুধাবি ও অন্যান্য)',
    countryEn: 'UAE — Abu Dhabi / Sharjah (ICP)',
    flag: '🇦🇪',
    region: 'middle_east',
    portalName: 'ICP Smart Services',
    domain: 'smartservices.icp.gov.ae',
    url: 'https://smartservices.icp.gov.ae/',
    noteBn: 'আবুধাবি, শারজাহ, আজমান ও অন্যান্য আমিরাতের ভিসা চেক',
    keywords: 'uae abu dhabi sharjah ajman icp আবুধাবি শারজাহ আজমান আমিরাত'
  },
  {
    id: 'qatar',
    countryBn: 'কাতার',
    countryEn: 'Qatar (MOI)',
    flag: '🇶🇦',
    region: 'middle_east',
    portalName: 'Ministry of Interior Qatar',
    domain: 'moi.gov.qa',
    url: 'https://moi.gov.qa/',
    noteBn: 'পাসপোর্ট বা ভিসা নম্বর দিয়ে কাতার ভিসা ইনকোয়ারি ও প্রিন্ট',
    keywords: 'qatar doha moi কাতার দোহা'
  },
  {
    id: 'kuwait',
    countryBn: 'কুয়েত',
    countryEn: 'Kuwait (MOI e-Visa)',
    flag: '🇰🇼',
    region: 'middle_east',
    portalName: 'Kuwait MOI Visa Status',
    domain: 'rnt.moi.gov.kw',
    url: 'https://rnt.moi.gov.kw/esrv/VisaStat.do',
    noteBn: 'কুয়েত ই-ভিসা ও ওয়ার্ক ভিসা স্ট্যাটাস অনলাইন যাচাই',
    keywords: 'kuwait moi evisa কুয়েত'
  },
  {
    id: 'oman',
    countryBn: 'ওমান',
    countryEn: 'Oman (ROP e-Visa)',
    flag: '🇴🇲',
    region: 'middle_east',
    portalName: 'Royal Oman Police eVisa',
    domain: 'evisa.rop.gov.om',
    url: 'https://evisa.rop.gov.om/',
    noteBn: 'রয়্যাল ওমান পুলিশ পোর্টালে ওমান ভিসা স্ট্যাটাস চেক',
    keywords: 'oman muscat rop ওমান মাস্কাট'
  },
  {
    id: 'bahrain',
    countryBn: 'বাহরাইন',
    countryEn: 'Bahrain (NPRA e-Visa)',
    flag: '🇧🇭',
    region: 'middle_east',
    portalName: 'Bahrain Electronic Visa',
    domain: 'evisa.gov.bh',
    url: 'https://www.evisa.gov.bh',
    noteBn: 'বাহরাইন ই-ভিসা যোগ্যতা ও অ্যাপ্লিকেশন স্ট্যাটাস যাচাই',
    keywords: 'bahrain manama npra বাহরাইন'
  },
  {
    id: 'jordan',
    countryBn: 'জর্ডান',
    countryEn: 'Jordan (MOI)',
    flag: '🇯🇴',
    region: 'middle_east',
    portalName: 'MOI Jordan E-Services',
    domain: 'eservices.moi.gov.jo',
    url: 'https://eservices.moi.gov.jo',
    noteBn: 'জর্ডান ভিসা ও ই-সার্ভিস অ্যাপ্লিকেশন যাচাই',
    keywords: 'jordan amman moi জর্ডান'
  },
  {
    id: 'egypt',
    countryBn: 'মিশর',
    countryEn: 'Egypt (e-Visa)',
    flag: '🇪🇬',
    region: 'middle_east',
    portalName: 'Egypt Official e-Visa Portal',
    domain: 'visa2egypt.gov.eg',
    url: 'https://www.visa2egypt.gov.eg',
    noteBn: 'মিশর ইলেকট্রনিক ভিসা ও স্ট্যাটাস ট্র্যাকিং',
    keywords: 'egypt cairo মিশর কায়রো'
  },
  {
    id: 'turkey',
    countryBn: 'তুরস্ক',
    countryEn: 'Türkiye (e-Visa)',
    flag: '🇹🇷',
    region: 'middle_east',
    portalName: 'Türkiye Official e-Visa',
    domain: 'evisa.gov.tr',
    url: 'https://www.evisa.gov.tr',
    noteBn: 'তুরস্ক ই-ভিসা যাচাই ও অফিসিয়াল ডাউনলোড',
    keywords: 'turkey turkiye istanbul তুরস্ক'
  },

  // Asia
  {
    id: 'malaysia',
    countryBn: 'মালয়েশিয়া',
    countryEn: 'Malaysia (IMI e-Visa)',
    flag: '🇲🇾',
    region: 'asia',
    portalName: 'Malaysia Immigration eVISA',
    domain: 'malaysiavisa.imi.gov.my',
    url: 'https://malaysiavisa.imi.gov.my/',
    noteBn: 'পাসপোর্ট ও স্টিকার নম্বর দিয়ে মালয়েশিয়া ই-ভিসা ভেরিফাই',
    keywords: 'malaysia kuala lumpur imi মালয়েশিয়া'
  },
  {
    id: 'singapore',
    countryBn: 'সিঙ্গাপুর',
    countryEn: 'Singapore (ICA SAVE)',
    flag: '🇸🇬',
    region: 'asia',
    portalName: 'ICA Singapore SAVE Portal',
    domain: 'eservices.ica.gov.sg',
    url: 'https://eservices.ica.gov.sg/ipsave/index.xhtml',
    noteBn: 'সিঙ্গাপুর ICA SAVE সিস্টেমে ভিসা ও অ্যাপ্লিকেশন চেক',
    keywords: 'singapore ica save সিঙ্গাপুর'
  },
  {
    id: 'india-regular',
    countryBn: 'ভারত (রেগুলার ভিসা)',
    countryEn: 'India — Regular Visa',
    flag: '🇮🇳',
    region: 'asia',
    portalName: 'Indian Visa Online (MHA)',
    domain: 'indianvisaonline.gov.in',
    url: 'https://indianvisaonline.gov.in/visa/',
    noteBn: 'ওয়েব ফাইল নম্বর দিয়ে ভারতের রেগুলার ভিসা স্ট্যাটাস চেক',
    keywords: 'india regular visa ivac ভারত ইন্ডিয়া'
  },
  {
    id: 'india-evisa',
    countryBn: 'ভারত (ই-ভিসা)',
    countryEn: 'India — e-Visa',
    flag: '🇮🇳',
    region: 'asia',
    portalName: 'Indian e-Visa Portal',
    domain: 'indianvisaonline.gov.in/evisa',
    url: 'https://indianvisaonline.gov.in/evisa/tvoa.html',
    noteBn: 'অ্যাপ্লিকেশন আইডি ও পাসপোর্ট নম্বর দিয়ে ভারত ই-ভিসা চেক',
    keywords: 'india evisa medical tourist ভারত ই-ভিসা'
  },
  {
    id: 'thailand',
    countryBn: 'থাইল্যান্ড',
    countryEn: 'Thailand (Thai e-Visa)',
    flag: '🇹🇭',
    region: 'asia',
    portalName: 'Thailand Official e-Visa',
    domain: 'thaievisa.go.th',
    url: 'https://www.thaievisa.go.th',
    noteBn: 'থাইল্যান্ড পররাষ্ট্র মন্ত্রণালয়ের অফিশিয়াল ই-ভিসা পোর্টাল',
    keywords: 'thailand bangkok থাইল্যান্ড ব্যাংকক'
  },
  {
    id: 'indonesia',
    countryBn: 'ইন্দোনেশিয়া',
    countryEn: 'Indonesia (Imigrasi)',
    flag: '🇮🇩',
    region: 'asia',
    portalName: 'Indonesia Official e-Visa',
    domain: 'evisa.imigrasi.go.id',
    url: 'https://evisa.imigrasi.go.id',
    noteBn: 'ইন্দোনেশিয়া ই-ভিসা ও VOA স্ট্যাটাস যাচাই',
    keywords: 'indonesia bali jakarta ইন্দোনেশিয়া বালি'
  },
  {
    id: 'vietnam',
    countryBn: 'ভিয়েতনাম',
    countryEn: 'Vietnam (e-Visa)',
    flag: '🇻🇳',
    region: 'asia',
    portalName: 'Vietnam National e-Visa',
    domain: 'evisa.gov.vn',
    url: 'https://evisa.gov.vn',
    noteBn: 'রেজিস্ট্রেশন কোড ও ইমেইল দিয়ে ভিয়েতনাম ই-ভিসা সার্চ',
    keywords: 'vietnam hanoi ভিয়েতনাম'
  },
  {
    id: 'south-korea',
    countryBn: 'দক্ষিণ কোরিয়া',
    countryEn: 'South Korea (Visa Portal)',
    flag: '🇰🇷',
    region: 'asia',
    portalName: 'Korea Visa Portal',
    domain: 'visa.go.kr',
    url: 'https://www.visa.go.kr',
    noteBn: 'পাসপোর্ট নম্বর ও জন্ম তারিখ দিয়ে কোরিয়া ভিসা স্ট্যাটাস চেক',
    keywords: 'south korea seoul eps দক্ষিণ কোরিয়া কোরিয়া'
  },
  {
    id: 'japan',
    countryBn: 'জাপান',
    countryEn: 'Japan (MOFA eVISA)',
    flag: '🇯🇵',
    region: 'asia',
    portalName: 'Japan eVISA System',
    domain: 'evisa.mofa.go.jp',
    url: 'https://www.evisa.mofa.go.jp',
    noteBn: 'জাপান পররাষ্ট্র মন্ত্রণালয়ের অফিশিয়াল ই-ভিসা পোর্টাল',
    keywords: 'japan tokyo mofa জাপান'
  },
  {
    id: 'china',
    countryBn: 'চীন',
    countryEn: 'China (COVA / MFA)',
    flag: '🇨🇳',
    region: 'asia',
    portalName: 'China Consular Visa Portal',
    domain: 'consular.mfa.gov.cn',
    url: 'https://consular.mfa.gov.cn',
    noteBn: 'চায়না ভিসা অ্যাপ্লিকেশন ও ট্র্যাকিং পোর্টাল',
    keywords: 'china beijing cova চীন চায়না'
  },
  {
    id: 'bangladesh-bmet',
    countryBn: 'বাংলাদেশ BMET (ক্লিয়ারেন্স)',
    countryEn: 'Bangladesh — BMET Clearance',
    flag: '🇧🇩',
    region: 'asia',
    portalName: 'BMET Official Portal',
    domain: 'bmet.gov.bd',
    url: 'http://www.bmet.gov.bd',
    noteBn: 'বিদেশগামী কর্মীদের বিএমইটি স্মার্ট কার্ড ও ক্লিয়ারেন্স যাচাই',
    keywords: 'bangladesh bmet smart card clearance manpower বাংলাদেশ বিএমইটি স্মার্ট কার্ড'
  },

  // Europe & Schengen
  {
    id: 'uk',
    countryBn: 'যুক্তরাজ্য (UK)',
    countryEn: 'United Kingdom (UKVI)',
    flag: '🇬🇧',
    region: 'europe',
    portalName: 'GOV.UK Immigration Status',
    domain: 'gov.uk',
    url: 'https://www.gov.uk/view-prove-immigration-status',
    noteBn: 'UKVI অ্যাকাউন্টের মাধ্যমে ই-ভিসা ও স্ট্যাটাস যাচাই',
    keywords: 'uk united kingdom london ukvi যুক্তরাজ্য লন্ডন ব্রিটেন'
  },
  {
    id: 'italy',
    countryBn: 'ইতালি',
    countryEn: 'Italy (Schengen / VFS)',
    flag: '🇮🇹',
    region: 'europe',
    portalName: 'Italy Visa / VFS Global',
    domain: 'vfsglobal.com',
    url: 'https://www.vfsglobal.com',
    noteBn: 'ইতালি শেনজেন ও ওয়ার্ক ভিসা অ্যাপ্লিকেশন ট্র্যাকিং',
    keywords: 'italy rome schengen vfs ইতালি রোম ইউরোপ'
  },
  {
    id: 'portugal',
    countryBn: 'পর্তুগাল',
    countryEn: 'Portugal (MNE Visa)',
    flag: '🇵🇹',
    region: 'europe',
    portalName: 'Portugal Ministry of Foreign Affairs',
    domain: 'vistos.mne.gov.pt',
    url: 'https://vistos.mne.gov.pt',
    noteBn: 'পর্তুগাল ভিসা পোর্টাল ও অ্যাপ্লিকেশন তথ্য যাচাই',
    keywords: 'portugal lisbon schengen পর্তুগাল'
  },
  {
    id: 'romania',
    countryBn: 'রোমানিয়া',
    countryEn: 'Romania (MAE eViza)',
    flag: '🇷🇴',
    region: 'europe',
    portalName: 'Romania Official eViza',
    domain: 'evisa.mae.ro',
    url: 'https://evisa.mae.ro',
    noteBn: 'রোমানিয়া ওয়ার্ক ও ভিজিট ভিসা রিয়েল-টাইম স্ট্যাটাস চেক',
    keywords: 'romania bucharest eviza রোমানিয়া'
  },
  {
    id: 'france',
    countryBn: 'ফ্রান্স',
    countryEn: 'France (France-Visas)',
    flag: '🇫🇷',
    region: 'europe',
    portalName: 'France-Visas Official Portal',
    domain: 'france-visas.gouv.fr',
    url: 'https://france-visas.gouv.fr',
    noteBn: 'ফ্রান্স শেনজেন ভিসা ট্র্যাকিং ও ড্যাশবোর্ড',
    keywords: 'france paris schengen ফ্রান্স প্যারিস'
  },
  {
    id: 'germany',
    countryBn: 'জার্মানি',
    countryEn: 'Germany (VIDEX Consular)',
    flag: '🇩🇪',
    region: 'europe',
    portalName: 'Germany Consular Portal',
    domain: 'videx.diplo.de',
    url: 'https://videx.diplo.de',
    noteBn: 'জার্মানি ভিসা পোর্টাল ও অ্যাপ্লিকেশন ট্র্যাকিং',
    keywords: 'germany berlin schengen জার্মানি'
  },
  {
    id: 'poland',
    countryBn: 'পোল্যান্ড',
    countryEn: 'Poland (e-Konsulat)',
    flag: '🇵🇱',
    region: 'europe',
    portalName: 'Poland e-Konsulat Portal',
    domain: 'secure2.e-konsulat.gov.pl',
    url: 'https://secure2.e-konsulat.gov.pl',
    noteBn: 'পোল্যান্ড ন্যাশনাল ও শেনজেন ভিসা পোর্টাল',
    keywords: 'poland warsaw schengen পোল্যান্ড'
  },
  {
    id: 'spain',
    countryBn: 'স্পেন',
    countryEn: 'Spain (MFA / BLS)',
    flag: '🇪🇸',
    region: 'europe',
    portalName: 'Spain Foreign Affairs Portal',
    domain: 'exteriores.gob.es',
    url: 'https://www.exteriores.gob.es',
    noteBn: 'স্পেন ভিসা ও কনস্যুলার স্ট্যাটাস যাচাই',
    keywords: 'spain madrid bls schengen স্পেন'
  },

  // Americas & Oceania
  {
    id: 'usa',
    countryBn: 'যুক্তরাষ্ট্র (USA)',
    countryEn: 'United States (CEAC)',
    flag: '🇺🇸',
    region: 'americas_oceania',
    portalName: 'US Dept. of State CEAC Tracker',
    domain: 'ceac.state.gov',
    url: 'https://ceac.state.gov/CEACStatTracker/',
    noteBn: 'DS-160 / Case ID দিয়ে আমেরিকার ভিসা স্ট্যাটাস চেক',
    keywords: 'usa america us united states ceac আমেরিকা যুক্তরাষ্ট্র ইউএসএ'
  },
  {
    id: 'canada',
    countryBn: 'কানাডা',
    countryEn: 'Canada (IRCC Tracker)',
    flag: '🇨🇦',
    region: 'americas_oceania',
    portalName: 'IRCC Application Status Tracker',
    domain: 'ircctracker-suivi.cic.gc.ca',
    url: 'https://ircctracker-suivi.cic.gc.ca/',
    noteBn: 'কানাডা স্টাডি, ওয়ার্ক, ভিজিট ও পিআর ভিসা ট্র্যাক করুন',
    keywords: 'canada ircc toronto কানাডা'
  },
  {
    id: 'australia',
    countryBn: 'অস্ট্রেলিয়া',
    countryEn: 'Australia (VEVO Check)',
    flag: '🇦🇺',
    region: 'americas_oceania',
    portalName: 'Home Affairs VEVO Portal',
    domain: 'immi.homeaffairs.gov.au',
    url: 'https://immi.homeaffairs.gov.au/visas/already-have-a-visa/check-visa-details-and-conditions/overview',
    noteBn: 'VEVO সিস্টেমে অস্ট্রেলিয়া ভিসার বৈধতা ও শর্তাবলি চেক করুন',
    keywords: 'australia vevo sydney melbourne অস্ট্রেলিয়া'
  },
  {
    id: 'new-zealand',
    countryBn: 'নিউজিল্যান্ড',
    countryEn: 'New Zealand (INZ)',
    flag: '🇳🇿',
    region: 'americas_oceania',
    portalName: 'Immigration New Zealand',
    domain: 'immigration.govt.nz',
    url: 'https://www.immigration.govt.nz',
    noteBn: 'নিউজিল্যান্ড অনলাইন ভিসা ও NZeTA স্ট্যাটাস চেক',
    keywords: 'new zealand auckland inz নিউজিল্যান্ড'
  },

  // Worldwide Trackers (All 195+ Countries)
  {
    id: 'global-vfs',
    countryBn: 'বিশ্বের ১৪০+ দেশ (VFS Global)',
    countryEn: 'Worldwide — VFS Global Tracker',
    flag: '🌍',
    region: 'global',
    portalName: 'VFS Global Official Portal',
    domain: 'vfsglobal.com',
    url: 'https://www.vfsglobal.com',
    noteBn: 'ইউরোপ, এশিয়া, আফ্রিকা ও মধ্যপ্রাচ্যের ১৪০+ দেশের ভিসা ট্র্যাকিং',
    keywords: 'vfs global worldwide all countries europe schengen greece malta cyprus sweden croatia বিশ্বের সব দেশ ইউরোপ'
  },
  {
    id: 'global-tls',
    countryBn: 'আন্তর্জাতিক ভিসা (TLScontact)',
    countryEn: 'Worldwide — TLScontact',
    flag: '🌐',
    region: 'global',
    portalName: 'TLScontact Visa Tracking',
    domain: 'tlscontact.com',
    url: 'https://www.tlscontact.com',
    noteBn: 'যুক্তরাজ্য, ফ্রান্স, জার্মানি, বেলজিয়াম ও বহু দেশের ভিসা ট্র্যাকিং',
    keywords: 'tlscontact global europe uk belgium switzerland সব দেশ'
  },
  {
    id: 'global-bls',
    countryBn: 'বৈশ্বিক ট্র্যাকার (BLS International)',
    countryEn: 'Worldwide — BLS International',
    flag: '🌐',
    region: 'global',
    portalName: 'BLS International Portal',
    domain: 'blsinternational.com',
    url: 'https://www.blsinternational.com',
    noteBn: 'স্পেন, পর্তুগাল ও বিভিন্ন দেশের কনস্যুলার ভিসা ট্র্যাকিং',
    keywords: 'bls international spain global worldwide সব দেশ'
  },
  {
    id: 'global-iata',
    countryBn: 'বিশ্বের ১৯৫+ দেশ (IATA চেক)',
    countryEn: 'All 195+ Countries — IATA Travel Centre',
    flag: '✈️',
    region: 'global',
    portalName: 'IATA Travel Centre',
    domain: 'iatatravelcentre.com',
    url: 'https://www.iatatravelcentre.com',
    noteBn: 'বিশ্বের ১৯৫+ দেশের ভিসা, পাসপোর্ট ও ট্রাভেল নিয়মাবলি যাচাই',
    keywords: 'iata worldwide all countries passport requirement বিশ্বের সকল দেশ ভিসা তথ্য'
  }
];

const REGION_TABS: { id: VisaRegion; labelBn: string }[] = [
  { id: 'all', labelBn: 'সকল দেশ' },
  { id: 'middle_east', labelBn: 'সৌদি ও মধ্যপ্রাচ্য' },
  { id: 'asia', labelBn: 'এশিয়া' },
  { id: 'europe', labelBn: 'ইউরোপ ও শেনজেন' },
  { id: 'americas_oceania', labelBn: 'আমেরিকা ও অস্ট্রেলিয়া' },
  { id: 'global', labelBn: 'গ্লোবাল (সব দেশ)' }
];

export const VisaCheckPortal: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<VisaRegion>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const trimmedQuery = searchQuery.trim().toLowerCase();

  const slides = useMemo(() => {
    const regionFiltered =
      selectedRegion === 'all'
        ? ALL_VISA_PORTALS
        : ALL_VISA_PORTALS.filter((item) => item.region === selectedRegion);

    if (!trimmedQuery) return regionFiltered;

    const searchable = selectedRegion === 'all' ? ALL_VISA_PORTALS : regionFiltered;
    return searchable.filter((item) => {
      const hay = `${item.countryBn} ${item.countryEn} ${item.portalName} ${item.domain} ${item.noteBn} ${item.keywords}`.toLowerCase();
      return hay.includes(trimmedQuery);
    });
  }, [selectedRegion, trimmedQuery]);

  // Reset slider position whenever region or search changes
  useEffect(() => {
    setActiveSlideIndex(0);
    if (trackRef.current) {
      trackRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [selectedRegion, trimmedQuery]);

  const getStepWidth = useCallback(() => {
    const el = trackRef.current;
    if (!el) return 300;
    const firstCard = el.querySelector<HTMLElement>('[data-visa-slide="true"]');
    if (firstCard) {
      return firstCard.offsetWidth + 16; // card width + gap-4 (16px)
    }
    return Math.max(260, el.clientWidth * 0.8);
  }, []);

  const handleSlideNext = useCallback(() => {
    const el = trackRef.current;
    if (!el || slides.length <= 1) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 8) return;

    if (el.scrollLeft >= maxScroll - 16) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
      setActiveSlideIndex(0);
    } else {
      const step = getStepWidth();
      el.scrollBy({ left: step, behavior: 'smooth' });
    }
  }, [slides.length, getStepWidth]);

  const handleSlidePrev = useCallback(() => {
    const el = trackRef.current;
    if (!el || slides.length <= 1) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 8) return;

    if (el.scrollLeft <= 16) {
      el.scrollTo({ left: maxScroll, behavior: 'smooth' });
    } else {
      const step = getStepWidth();
      el.scrollBy({ left: -step, behavior: 'smooth' });
    }
  }, [slides.length, getStepWidth]);

  const handleTrackScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el || slides.length === 0) return;
    const step = getStepWidth();
    if (step <= 0) return;
    const idx = Math.round(el.scrollLeft / step);
    setActiveSlideIndex(Math.max(0, Math.min(slides.length - 1, idx)));
  }, [slides.length, getStepWidth]);

  const scrollToSlide = useCallback(
    (index: number) => {
      const el = trackRef.current;
      if (!el) return;
      const step = getStepWidth();
      el.scrollTo({ left: index * step, behavior: 'smooth' });
      setActiveSlideIndex(index);
    },
    [getStepWidth]
  );

  // Smooth auto-slide timer (pauses on hover, touch, search, or manual pause)
  useEffect(() => {
    if (!isAutoPlay || isHovered || trimmedQuery.length > 0 || slides.length <= 1) return;
    const timer = setInterval(() => {
      handleSlideNext();
    }, 3400);
    return () => clearInterval(timer);
  }, [isAutoPlay, isHovered, trimmedQuery, slides.length, handleSlideNext]);

  // Compact pagination indicator windows (up to 7 dots)
  const totalDots = Math.min(slides.length, 7);
  const activeDot =
    slides.length <= 7
      ? activeSlideIndex
      : Math.min(
          totalDots - 1,
          Math.floor((activeSlideIndex / Math.max(1, slides.length - 1)) * (totalDots - 1))
        );

  return (
    <section
      id="visa-check-portal"
      className="py-12 sm:py-16 bg-gradient-to-b from-[#f6f2ea] via-[#faf8f5] to-white border-b border-stone-200 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Compact Header + Search Row */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#06231a]/5 border border-[#DCB473]/50 text-[#06231a] text-[11px] font-bold tracking-wide mb-2">
              <Globe className="w-3.5 h-3.5 text-[#b88e44]" />
              <span>অফিশিয়াল ভিসা চেক স্লাইডার · Saudi &amp; Worldwide</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#06231a] font-serif leading-tight">
              সৌদি আরব ও <span className="text-[#b88e44]">বিশ্বের সকল দেশের</span> ভিসা চেক
            </h2>
            <p className="mt-1.5 text-stone-600 text-xs sm:text-sm max-w-2xl">
              বামে-ডানে স্লাইড করে বা দেশের নাম সার্চ করে সরাসরি সংশ্লিষ্ট দেশের সরকারি ওয়েবসাইটে ভিসা যাচাই করুন।
            </p>
          </div>

          {/* Live Country Search */}
          <div className="relative w-full lg:w-88 shrink-0">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="দেশ খুঁজুন... (সৌদি, দুবাই, কাতার, মালয়েশিয়া, USA)"
              aria-label="ভিসা চেক করার জন্য দেশ খুঁজুন"
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 bg-white text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#06231a]/25 focus:border-[#06231a] shadow-2xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="সার্চ মুছুন"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/70 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Region Filter Tabs + Slider Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="visa-slider-track flex items-center gap-1.5 overflow-x-auto pb-1">
            {REGION_TABS.map((tab) => {
              const active = selectedRegion === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedRegion(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    active
                      ? 'bg-[#06231a] text-[#DCB473] border-[#06231a] shadow-xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
                  }`}
                >
                  {tab.labelBn}
                </button>
              );
            })}
          </div>

          {slides.length > 0 && (
            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
              <span className="text-[11px] font-mono font-bold text-stone-500 bg-white px-2.5 py-1 rounded-lg border border-stone-200">
                {activeSlideIndex + 1} / {slides.length}
              </span>

              <button
                type="button"
                onClick={() => setIsAutoPlay((prev) => !prev)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 text-[11px] font-bold transition-colors cursor-pointer"
                title={isAutoPlay ? 'অটো স্লাইড থামান' : 'অটো স্লাইড চালু করুন'}
              >
                {isAutoPlay ? (
                  <>
                    <Pause className="w-3 h-3 text-[#b88e44]" />
                    <span>বিরতি</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 text-emerald-700" />
                    <span>চালু</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSlidePrev}
                  aria-label="পূর্ববর্তী ভিসা স্লাইড"
                  className="w-8 h-8 rounded-full bg-white hover:bg-[#06231a] text-[#06231a] hover:text-[#DCB473] border border-stone-300 hover:border-[#06231a] flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleSlideNext}
                  aria-label="পরবর্তী ভিসা স্লাইড"
                  className="w-8 h-8 rounded-full bg-white hover:bg-[#06231a] text-[#06231a] hover:text-[#DCB473] border border-stone-300 hover:border-[#06231a] flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* HORIZONTAL SLIDER STAGE */}
        {slides.length > 0 ? (
          <div
            className="relative group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={() => setIsHovered(true)}
            onTouchEnd={() => setIsHovered(false)}
          >
            {/* Left Floating Arrow (Desktop) */}
            {slides.length > 1 && (
              <button
                type="button"
                onClick={handleSlidePrev}
                aria-label="বামে স্লাইড করুন"
                className="hidden md:flex absolute -left-3.5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#06231a] hover:bg-[#0d3a2c] text-[#DCB473] border-2 border-[#DCB473]/70 shadow-lg items-center justify-center transition-all hover:scale-105 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Right Floating Arrow (Desktop) */}
            {slides.length > 1 && (
              <button
                type="button"
                onClick={handleSlideNext}
                aria-label="ডানে স্লাইড করুন"
                className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#06231a] hover:bg-[#0d3a2c] text-[#DCB473] border-2 border-[#DCB473]/70 shadow-lg items-center justify-center transition-all hover:scale-105 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {/* Scroll-Snap Horizontal Slider Track */}
            <div
              ref={trackRef}
              onScroll={handleTrackScroll}
              className="visa-slider-track flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 px-0.5"
            >
              {slides.map((item) => {
                const isSaudi = Boolean(item.featuredSaudi);
                return (
                  <a
                    key={item.id}
                    data-visa-slide="true"
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group/card snap-start shrink-0 w-[84%] sm:w-[46%] lg:w-[31.8%] xl:w-[24%] rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                      isSaudi
                        ? 'bg-gradient-to-br from-[#051c15] via-[#0a3023] to-[#06231a] text-white border-2 border-[#DCB473]/80 shadow-lg hover:shadow-xl'
                        : 'bg-white text-stone-800 border border-stone-200 hover:border-[#DCB473] shadow-sm hover:shadow-lg'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2.5 mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-2xs border ${
                              isSaudi
                                ? 'bg-emerald-900/80 border-[#DCB473]/50'
                                : 'bg-[#faf8f5] border-stone-200'
                            }`}
                            aria-hidden="true"
                          >
                            {item.flag}
                          </span>
                          <div className="min-w-0">
                            {isSaudi && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#DCB473] uppercase tracking-wider mb-0.5">
                                <ShieldCheck className="w-3 h-3" />
                                <span>অফিশিয়াল সৌদি পোর্টাল</span>
                              </span>
                            )}
                            <h3
                              className={`text-sm sm:text-[15px] font-bold leading-snug truncate ${
                                isSaudi
                                  ? 'text-white group-hover/card:text-[#f0d295]'
                                  : 'text-[#06231a] group-hover/card:text-[#0d4633]'
                              }`}
                            >
                              {item.countryBn}
                            </h3>
                            <p
                              className={`text-[11px] truncate ${
                                isSaudi ? 'text-emerald-200/80' : 'text-stone-500'
                              }`}
                            >
                              {item.countryEn}
                            </p>
                          </div>
                        </div>

                        <ExternalLink
                          className={`w-4 h-4 shrink-0 mt-1 transition-transform group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5 ${
                            isSaudi
                              ? 'text-[#DCB473]'
                              : 'text-stone-400 group-hover/card:text-[#b88e44]'
                          }`}
                        />
                      </div>

                      <p
                        className={`text-xs leading-relaxed line-clamp-2 min-h-[38px] ${
                          isSaudi ? 'text-emerald-100/85' : 'text-stone-600'
                        }`}
                      >
                        {item.noteBn}
                      </p>
                    </div>

                    <div
                      className={`mt-4 pt-3 border-t flex items-center justify-between gap-2 ${
                        isSaudi ? 'border-white/15' : 'border-stone-100'
                      }`}
                    >
                      <span
                        className={`text-[11px] font-mono truncate ${
                          isSaudi ? 'text-[#DCB473]/90' : 'text-stone-500'
                        }`}
                      >
                        {item.domain}
                      </span>
                      <span
                        className={`text-xs font-bold whitespace-nowrap shrink-0 inline-flex items-center gap-1 transition-colors ${
                          isSaudi
                            ? 'text-[#DCB473] group-hover/card:text-white'
                            : 'text-[#06231a] group-hover/card:text-[#b88e44]'
                        }`}
                      >
                        <span>চেক করুন</span>
                        <span className="group-hover/card:translate-x-0.5 transition-transform">→</span>
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>

            {/* Bottom Progress Dots + Trust Footnote */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                {Array.from({ length: totalDots }).map((_, dotIdx) => {
                  const targetIndex =
                    slides.length <= 7
                      ? dotIdx
                      : Math.round((dotIdx / Math.max(1, totalDots - 1)) * (slides.length - 1));
                  return (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={() => scrollToSlide(targetIndex)}
                      aria-label={`স্লাইড ${targetIndex + 1} দেখুন`}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        dotIdx === activeDot
                          ? 'w-7 bg-[#06231a]'
                          : 'w-2 bg-stone-300 hover:bg-[#DCB473]'
                      }`}
                    />
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-1 text-[11px] text-stone-500">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>সকল লিংক সরাসরি অফিশিয়াল সরকারি পোর্টালে ওপেন হবে</span>
                </span>
                <a
                  href="https://www.vfsglobal.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#06231a] hover:text-[#b88e44] inline-flex items-center gap-1 transition-colors"
                >
                  <span>VFS Global (১৪০+ দেশ)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        ) : (
          /* Smart Worldwide Fallback if user searches a country outside the 38 cards */
          <div className="rounded-2xl bg-white border border-stone-200 p-6 text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#06231a]/10 text-[#06231a] flex items-center justify-center mx-auto">
              <Compass className="w-6 h-6 text-[#b88e44]" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#06231a]">
                &ldquo;{searchQuery}&rdquo; এর অফিশিয়াল ভিসা পোর্টাল খুঁজুন
              </h4>
              <p className="text-xs text-stone-600 mt-1 max-w-lg mx-auto">
                নিচের লিংকগুলোর মাধ্যমে বিশ্বের যেকোনো দেশের সরকারি ভিসা চেক পোর্টাল বা VFS Global ট্র্যাকারে সরাসরি যেতে পারবেন।
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(
                  `${searchQuery.trim()} official government visa status check online`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#06231a] hover:bg-[#0b382a] text-[#DCB473] text-xs font-bold shadow-xs transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>&ldquo;{searchQuery}&rdquo; অফিশিয়াল ভিসা পোর্টাল খুঁজুন</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://www.vfsglobal.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#faf8f5] hover:bg-stone-100 text-[#06231a] border border-stone-300 text-xs font-bold transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-[#b88e44]" />
                <span>VFS Global (১৪০+ দেশ)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
