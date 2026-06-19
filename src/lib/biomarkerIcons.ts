// Biomarker icon imports
import Albumin from '@/assets/biomarker-icons/Albumin.png';
import AlkalinePhosphatase from '@/assets/biomarker-icons/Alkaline_Phosphatase.png';
import Amylase from '@/assets/biomarker-icons/Amylase.png';
import ApoB from '@/assets/biomarker-icons/ApoB.png';
import Basophils from '@/assets/biomarker-icons/Basophils.png';
import Bilirubin from '@/assets/biomarker-icons/Bilirubin.png';
import Calcium from '@/assets/biomarker-icons/Calcium.png';
import Cholesterol from '@/assets/biomarker-icons/Cholesterol.png';
import Creatinine from '@/assets/biomarker-icons/Creatinine.png';
import CRP from '@/assets/biomarker-icons/CRP.png';
import DHEAS from '@/assets/biomarker-icons/DHEAS.png';
import eGFR from '@/assets/biomarker-icons/eGFR.png';
import Eosinophils from '@/assets/biomarker-icons/Eosinophils.png';
import Erythrocytes from '@/assets/biomarker-icons/Erythrocytes.png';
import Ferritin from '@/assets/biomarker-icons/Ferritin.png';
import FreeTestosteron from '@/assets/biomarker-icons/Free_Testosteron.png';
import FSH from '@/assets/biomarker-icons/FSH.png';
import Ft3 from '@/assets/biomarker-icons/Ft3.png';
import Ft4 from '@/assets/biomarker-icons/Ft4.png';
import GammaGT from '@/assets/biomarker-icons/Gamma_GT.png';
import Glucose from '@/assets/biomarker-icons/Glucose.png';
import GOTAST from '@/assets/biomarker-icons/GOT_AST.png';
import GPTALAT from '@/assets/biomarker-icons/GPT_ALAT.png';
import HbA1c from '@/assets/biomarker-icons/HbA1c.png';
import HDLCholesterol from '@/assets/biomarker-icons/HDL_Cholesterol.png';
import Hematocrit from '@/assets/biomarker-icons/Hematocrit.png';
import Hemoglobin from '@/assets/biomarker-icons/Hemoglobin.png';
import HOMAIndex from '@/assets/biomarker-icons/HOMA_Index.png';
import ImmunoglobulinG from '@/assets/biomarker-icons/Immunoglobulin_G.png';
import Insulin from '@/assets/biomarker-icons/Insulin.png';
import Iron from '@/assets/biomarker-icons/Iron.png';
import LDH from '@/assets/biomarker-icons/LDH.png';
import LDLCholesterol from '@/assets/biomarker-icons/LDL_Cholesterol.png';
import LDLHDLRatio from '@/assets/biomarker-icons/LDL-HDL_Ratio.png';
import Leukocytes from '@/assets/biomarker-icons/Leukocytes.png';
import LH from '@/assets/biomarker-icons/LH.png';
import Lipase from '@/assets/biomarker-icons/Lipase.png';
import Lpa from '@/assets/biomarker-icons/Lp_a.png';
import Lymphocytes from '@/assets/biomarker-icons/Lymphocytes.png';
import Magnesium from '@/assets/biomarker-icons/Magnesium.png';
import MCH from '@/assets/biomarker-icons/MCH.png';
import MCHC from '@/assets/biomarker-icons/MCHC.png';
import MCV from '@/assets/biomarker-icons/MCV.png';
import Monocytes from '@/assets/biomarker-icons/Monocytes.png';
import Neutrophils from '@/assets/biomarker-icons/Neutrophils.png';
import NonHDLCholesterol from '@/assets/biomarker-icons/Non-HDL-Cholesterol.png';
import Omega36Ratio from '@/assets/biomarker-icons/Omega_3_6_ratio.png';
import Omega3 from '@/assets/biomarker-icons/Omega_3.png';
import Omega6 from '@/assets/biomarker-icons/Omega_6.png';
import Ostradiol from '@/assets/biomarker-icons/Ostradiol.png';
import Potassium from '@/assets/biomarker-icons/Potassium.png';
import Progesteron from '@/assets/biomarker-icons/Progesteron.png';
import Prolaktin from '@/assets/biomarker-icons/Prolaktin.png';
import Selenium from '@/assets/biomarker-icons/Selenium.png';
import SHBG from '@/assets/biomarker-icons/SHBG.png';
import Sodium from '@/assets/biomarker-icons/Sodium.png';
import Testosteron from '@/assets/biomarker-icons/Testosteron.png';
import Thrombocytes from '@/assets/biomarker-icons/Thrombocytes.png';
import TotalProtein from '@/assets/biomarker-icons/Total_protein.png';
import TransferrinSaturation from '@/assets/biomarker-icons/Transferrin_Saturation.png';
import Transferrin from '@/assets/biomarker-icons/Transferrin.png';
import Triglycerides from '@/assets/biomarker-icons/Triglycerides.png';
import TSH from '@/assets/biomarker-icons/TSH.png';
import UricAcid from '@/assets/biomarker-icons/Uric_Acid.png';
import VitaminB2 from '@/assets/biomarker-icons/Vitamin_B2.png';
import VitaminB6 from '@/assets/biomarker-icons/Vitamin_B6.png';
import VitaminB9 from '@/assets/biomarker-icons/Vitamin_B9.png';
import VitaminB12 from '@/assets/biomarker-icons/Vitamin_B12.png';
import VitaminD from '@/assets/biomarker-icons/Vitamin_D.png';
import Zinc from '@/assets/biomarker-icons/Zinc.png';

// Normalize code by removing special characters
function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/[*#%]/g, '');
}

// Map of biomarker codes/names to local icon paths
const biomarkerIconMap: Record<string, string> = {
  // By common codes (including API variants)
  'ALB': Albumin,
  'ALP': AlkalinePhosphatase,
  'AMY': Amylase,
  'APOB': ApoB,
  'APOBSI': ApoB,
  'BASO': Basophils,
  'BAS04': Basophils,
  'BASO4': Basophils,
  'BIL': Bilirubin,
  'TBIL': Bilirubin,
  'CA': Calcium,
  'CHOL': Cholesterol,
  'TC': Cholesterol,
  'CREA': Creatinine,
  'CRP': CRP,
  'HSCRP': CRP,
  'DHEAS': DHEAS,
  'DHEA-S': DHEAS,
  'EGFR': eGFR,
  'EOS': Eosinophils,
  'RBC': Erythrocytes,
  'ERY': Erythrocytes,
  'FER': Ferritin,
  'FERRITIN': Ferritin,
  'FTST': FreeTestosteron,
  'FSH': FSH,
  'FT3': Ft3,
  'T3F': Ft3,
  'FT4': Ft4,
  'T4F': Ft4,
  'GGT': GammaGT,
  'GLU': Glucose,
  'FPG': Glucose,
  'AST': GOTAST,
  'GOT': GOTAST,
  'ASAT': GOTAST,
  'ALT': GPTALAT,
  'GPT': GPTALAT,
  'ALAT': GPTALAT,
  'HBA1C': HbA1c,
  'A1C': HbA1c,
  'HDL': HDLCholesterol,
  'HDL-C': HDLCholesterol,
  'HDLC': HDLCholesterol,
  'HCT': Hematocrit,
  'HGB': Hemoglobin,
  'HB': Hemoglobin,
  'HOMA': HOMAIndex,
  'HOMA-IR': HOMAIndex,
  'IGG': ImmunoglobulinG,
  'INS': Insulin,
  'FE': Iron,
  'IRON': Iron,
  'LDH': LDH,
  'LDL': LDLCholesterol,
  'LDL-C': LDLCholesterol,
  'LDLC': LDLCholesterol,
  'LDL/HDL': LDLHDLRatio,
  'WBC': Leukocytes,
  'LEUK': Leukocytes,
  'LH': LH,
  'LIP': Lipase,
  'LPA': Lpa,
  'LP(A)': Lpa,
  'LYMPH': Lymphocytes,
  'MG': Magnesium,
  'MCH': MCH,
  'MCHC': MCHC,
  'MCV': MCV,
  'MONO': Monocytes,
  'NEUT': Neutrophils,
  'NHDL': NonHDLCholesterol,
  'NON-HDL': NonHDLCholesterol,
  'O3O6': Omega36Ratio,
  'O3': Omega3,
  'OMEGA3': Omega3,
  'O6': Omega6,
  'OMEGA6': Omega6,
  'E2': Ostradiol,
  'ESTRADIOL': Ostradiol,
  'K': Potassium,
  'PROG': Progesteron,
  'PRL': Prolaktin,
  'PROLACTIN': Prolaktin,
  'SE': Selenium,
  'SHBG': SHBG,
  'NA': Sodium,
  'TST': Testosteron,
  'TESTO': Testosteron,
  'PLT': Thrombocytes,
  'TP': TotalProtein,
  'TSAT': TransferrinSaturation,
  'TF': Transferrin,
  'TG': Triglycerides,
  'TRIG': Triglycerides,
  'TSH': TSH,
  'UA': UricAcid,
  'URIC': UricAcid,
  'VB2': VitaminB2,
  'B2': VitaminB2,
  'RIBOFLAVIN': VitaminB2,
  'VB6': VitaminB6,
  'B6': VitaminB6,
  'PYRIDOXINE': VitaminB6,
  'VB9': VitaminB9,
  'B9': VitaminB9,
  'FOLS': VitaminB9,
  'FOLATE': VitaminB9,
  'FOLIC': VitaminB9,
  'VB12': VitaminB12,
  'B12': VitaminB12,
  'COBALAMIN': VitaminB12,
  'VITD': VitaminD,
  '25OHD': VitaminD,
  'ZN': Zinc,
  
  // By name (lowercase for matching)
  'albumin': Albumin,
  'alkaline phosphatase': AlkalinePhosphatase,
  'amylase': Amylase,
  'apob': ApoB,
  'apolipoprotein b': ApoB,
  'basophils': Basophils,
  'bilirubin': Bilirubin,
  'calcium': Calcium,
  'cholesterol': Cholesterol,
  'total cholesterol': Cholesterol,
  'creatinine': Creatinine,
  'crp': CRP,
  'c-reactive protein': CRP,
  'dheas': DHEAS,
  'dhea-s': DHEAS,
  'egfr': eGFR,
  'eosinophils': Eosinophils,
  'erythrocytes': Erythrocytes,
  'red blood cells': Erythrocytes,
  'ferritin': Ferritin,
  'free testosterone': FreeTestosteron,
  'fsh': FSH,
  'follicle stimulating hormone': FSH,
  'ft3': Ft3,
  'free t3': Ft3,
  'ft4': Ft4,
  'free t4': Ft4,
  'gamma gt': GammaGT,
  'ggt': GammaGT,
  'glucose': Glucose,
  'fasting glucose': Glucose,
  'got': GOTAST,
  'ast': GOTAST,
  'gpt': GPTALAT,
  'alt': GPTALAT,
  'hba1c': HbA1c,
  'hemoglobin a1c': HbA1c,
  'hdl': HDLCholesterol,
  'hdl cholesterol': HDLCholesterol,
  'hematocrit': Hematocrit,
  'hemoglobin': Hemoglobin,
  'homa index': HOMAIndex,
  'homa-ir': HOMAIndex,
  'immunoglobulin g': ImmunoglobulinG,
  'igg': ImmunoglobulinG,
  'insulin': Insulin,
  'iron': Iron,
  'ldh': LDH,
  'lactate dehydrogenase': LDH,
  'ldl': LDLCholesterol,
  'ldl cholesterol': LDLCholesterol,
  'ldl/hdl ratio': LDLHDLRatio,
  'leukocytes': Leukocytes,
  'white blood cells': Leukocytes,
  'wbc': Leukocytes,
  'lh': LH,
  'luteinizing hormone': LH,
  'lipase': Lipase,
  'lp(a)': Lpa,
  'lipoprotein a': Lpa,
  'lymphocytes': Lymphocytes,
  'magnesium': Magnesium,
  'mch': MCH,
  'mchc': MCHC,
  'mcv': MCV,
  'monocytes': Monocytes,
  'neutrophils': Neutrophils,
  'non-hdl cholesterol': NonHDLCholesterol,
  'omega 3/6 ratio': Omega36Ratio,
  'omega-3': Omega3,
  'omega 3': Omega3,
  'omega-6': Omega6,
  'omega 6': Omega6,
  'estradiol': Ostradiol,
  'oestradiol': Ostradiol,
  'potassium': Potassium,
  'progesterone': Progesteron,
  'prolactin': Prolaktin,
  'selenium': Selenium,
  'shbg': SHBG,
  'sex hormone binding globulin': SHBG,
  'sodium': Sodium,
  'testosterone': Testosteron,
  'thrombocytes': Thrombocytes,
  'platelets': Thrombocytes,
  'total protein': TotalProtein,
  'transferrin saturation': TransferrinSaturation,
  'transferrin': Transferrin,
  'triglycerides': Triglycerides,
  'tsh': TSH,
  'thyroid stimulating hormone': TSH,
  'uric acid': UricAcid,
  'vitamin b2': VitaminB2,
  'riboflavin': VitaminB2,
  'vitamin b6': VitaminB6,
  'pyridoxine': VitaminB6,
  'vitamin b9': VitaminB9,
  'folate': VitaminB9,
  'folic acid': VitaminB9,
  'vitamin b12': VitaminB12,
  'cobalamin': VitaminB12,
  'vitamin d': VitaminD,
  '25-oh vitamin d': VitaminD,
  'zinc': Zinc,
};

/**
 * Get the local icon for a biomarker by code or name
 * Falls back to the provided API icon URL if no local match is found
 */
export function getBiomarkerIcon(codeOrName: string, fallbackUrl?: string): string | undefined {
  // Try exact match first (case insensitive for codes)
  const upperCode = codeOrName.toUpperCase();
  if (biomarkerIconMap[upperCode]) {
    return biomarkerIconMap[upperCode];
  }
  
  // Try normalized code (strip special characters like *, #, %)
  const normalized = normalizeCode(codeOrName);
  if (biomarkerIconMap[normalized]) {
    return biomarkerIconMap[normalized];
  }
  
  // Try lowercase name match
  const lowerName = codeOrName.toLowerCase();
  if (biomarkerIconMap[lowerName]) {
    return biomarkerIconMap[lowerName];
  }
  
  // Return fallback URL if provided
  return fallbackUrl;
}

/**
 * Check if we have a local icon for a biomarker
 */
export function hasLocalBiomarkerIcon(codeOrName: string): boolean {
  const upperCode = codeOrName.toUpperCase();
  const lowerName = codeOrName.toLowerCase();
  return !!(biomarkerIconMap[upperCode] || biomarkerIconMap[lowerName]);
}

export { biomarkerIconMap };
