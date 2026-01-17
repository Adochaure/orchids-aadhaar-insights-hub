export const INDIAN_STATES_AND_UTS: Record<string, string> = {
  'andhra pradesh': 'Andhra Pradesh',
  'ap': 'Andhra Pradesh',
  'arunachal pradesh': 'Arunachal Pradesh',
  'ar': 'Arunachal Pradesh',
  'assam': 'Assam',
  'as': 'Assam',
  'bihar': 'Bihar',
  'br': 'Bihar',
  'chhattisgarh': 'Chhattisgarh',
  'chattisgarh': 'Chhattisgarh',
  'cg': 'Chhattisgarh',
  'ct': 'Chhattisgarh',
  'goa': 'Goa',
  'ga': 'Goa',
  'gujarat': 'Gujarat',
  'gj': 'Gujarat',
  'haryana': 'Haryana',
  'hr': 'Haryana',
  'himachal pradesh': 'Himachal Pradesh',
  'hp': 'Himachal Pradesh',
  'jharkhand': 'Jharkhand',
  'jh': 'Jharkhand',
  'karnataka': 'Karnataka',
  'ka': 'Karnataka',
  'kerala': 'Kerala',
  'kl': 'Kerala',
  'madhya pradesh': 'Madhya Pradesh',
  'mp': 'Madhya Pradesh',
  'maharashtra': 'Maharashtra',
  'mh': 'Maharashtra',
  'manipur': 'Manipur',
  'mn': 'Manipur',
  'meghalaya': 'Meghalaya',
  'ml': 'Meghalaya',
  'mizoram': 'Mizoram',
  'mz': 'Mizoram',
  'nagaland': 'Nagaland',
  'nl': 'Nagaland',
  'odisha': 'Odisha',
  'orissa': 'Odisha',
  'od': 'Odisha',
  'or': 'Odisha',
  'punjab': 'Punjab',
  'pb': 'Punjab',
  'rajasthan': 'Rajasthan',
  'rj': 'Rajasthan',
  'sikkim': 'Sikkim',
  'sk': 'Sikkim',
  'tamil nadu': 'Tamil Nadu',
  'tamilnadu': 'Tamil Nadu',
  'tn': 'Tamil Nadu',
  'telangana': 'Telangana',
  'tg': 'Telangana',
  'ts': 'Telangana',
  'tripura': 'Tripura',
  'tr': 'Tripura',
  'uttar pradesh': 'Uttar Pradesh',
  'uttarpradesh': 'Uttar Pradesh',
  'up': 'Uttar Pradesh',
  'uttarakhand': 'Uttarakhand',
  'uttaranchal': 'Uttarakhand',
  'uk': 'Uttarakhand',
  'ut': 'Uttarakhand',
  'west bengal': 'West Bengal',
  'westbengal': 'West Bengal',
  'wb': 'West Bengal',
  
  'andaman and nicobar islands': 'Andaman and Nicobar Islands',
  'andaman and nicobar': 'Andaman and Nicobar Islands',
  'andaman & nicobar islands': 'Andaman and Nicobar Islands',
  'andaman & nicobar': 'Andaman and Nicobar Islands',
  'a&n islands': 'Andaman and Nicobar Islands',
  'an': 'Andaman and Nicobar Islands',
  'chandigarh': 'Chandigarh',
  'ch': 'Chandigarh',
  'dadra and nagar haveli and daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
  'dadra and nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
  'dadra & nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
  'daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
  'daman & diu': 'Dadra and Nagar Haveli and Daman and Diu',
  'dnhdd': 'Dadra and Nagar Haveli and Daman and Diu',
  'dn': 'Dadra and Nagar Haveli and Daman and Diu',
  'dd': 'Dadra and Nagar Haveli and Daman and Diu',
  'delhi': 'Delhi',
  'nct of delhi': 'Delhi',
  'new delhi': 'Delhi',
  'dl': 'Delhi',
  'jammu and kashmir': 'Jammu and Kashmir',
  'jammu & kashmir': 'Jammu and Kashmir',
  'j&k': 'Jammu and Kashmir',
  'jk': 'Jammu and Kashmir',
  'ladakh': 'Ladakh',
  'la': 'Ladakh',
  'lakshadweep': 'Lakshadweep',
  'ld': 'Lakshadweep',
  'puducherry': 'Puducherry',
  'pondicherry': 'Puducherry',
  'py': 'Puducherry',
};

export const VALID_INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

export function normalizeStateName(stateName: string): string {
  if (!stateName) return '';
  
  const cleaned = stateName.toLowerCase().trim().replace(/\s+/g, ' ');
  
  if (INDIAN_STATES_AND_UTS[cleaned]) {
    return INDIAN_STATES_AND_UTS[cleaned];
  }
  
  for (const [key, value] of Object.entries(INDIAN_STATES_AND_UTS)) {
    if (cleaned.includes(key) || key.includes(cleaned)) {
      return value;
    }
  }
  
  const titleCase = cleaned.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
  
  for (const validState of VALID_INDIAN_STATES) {
    if (validState.toLowerCase() === cleaned || 
        validState.toLowerCase().includes(cleaned) ||
        cleaned.includes(validState.toLowerCase())) {
      return validState;
    }
  }
  
  return titleCase;
}

export function isValidIndianState(stateName: string): boolean {
  const normalized = normalizeStateName(stateName);
  return VALID_INDIAN_STATES.includes(normalized);
}
