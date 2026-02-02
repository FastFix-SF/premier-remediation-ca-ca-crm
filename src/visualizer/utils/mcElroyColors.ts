export const McElroyColors: Record<string, string> = {
  "Regal White": "#F2F4F3",
  "Bone White": "#EDEBE6", 
  "Surrey Beige": "#B9AA9B",
  "Sandstone": "#D7CFBE",
  "Almond": "#D9CCB8",
  "Buckskin": "#7D6358",
  "Ash Gray": "#B2B2B2",
  "Slate Gray": "#7D7F82",
  "Charcoal": "#4A4D50",
  "Dark Charcoal": "#2F3032",
  "Matte Black": "#121417",
  "Medium Bronze": "#6A5746",
  "Dark Bronze": "#4A3A2A",
  "Patina Green": "#7A9A74",
  "Evergreen": "#2F5A3A",
  "Mansard Brown": "#4D2E25",
  "Colonial Red": "#7A1D1A",
  "Roman Blue": "#426C86",
  "Patrician Bronze": "#5C4633",
  "Terra Cotta": "#C65233",
  "Galvalume Plus": "#C3C6C9",
  "Regal Blue": "#1E4B7A",
  "Brite Red": "#C0131E",
  "Hartford Green": "#1E3A32",
  "Brandywine": "#5B1B22",
  "Silver Metallic": "#B9B9B9",
  "Champagne Metallic": "#C8BBA4",
  "Copper Penny Metallic": "#B87333",
  "Texas Silver Metallic": "#9EA7AD",
  "Leadcoat": "#7A7A7A",
  "Preweathered Galvalume": "#9C9E9F"
};

export const getColorName = (hex: string): string => {
  const entry = Object.entries(McElroyColors).find(([_, color]) => color.toLowerCase() === hex.toLowerCase());
  return entry ? entry[0] : hex;
};

export const getColorHex = (name: string): string => {
  return McElroyColors[name] || name;
};