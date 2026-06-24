export const ObjectType = {
  house: 'Дом',
  dacha: 'Дача',
  cottage: 'Коттедж',
  townhouse: 'Таунхаус',
} as const
export type ObjectType = keyof typeof ObjectType

export const Readiness = {
  built: 'Построен',
  unfinished: 'Недостроен',
  custom_build: 'Построим на заказ',
} as const
export type Readiness = keyof typeof Readiness

export const LandCategory = {
  izhs: 'ИЖС',
  lph: 'ЛПХ',
  dnp: 'ДНП',
  snt: 'СНТ',
  agricultural: 'Сельхоз',
  other: 'Другое',
} as const
export type LandCategory = keyof typeof LandCategory

export const WallMaterial = {
  brick: 'Кирпич',
  block: 'Блок',
  wood: 'Дерево',
  monolith: 'Монолит',
  frame: 'Каркас',
  other: 'Другое',
} as const
export type WallMaterial = keyof typeof WallMaterial

export const RoofMaterial = {
  metal: 'Металлочерепица',
  tile: 'Черепица',
  soft: 'Мягкая кровля',
  other: 'Другое',
} as const
export type RoofMaterial = keyof typeof RoofMaterial

export const Renovation = {
  required: 'Требуется',
  cosmetic: 'Косметический',
  euro: 'Евро',
  designer: 'Дизайнерский',
} as const
export type Renovation = keyof typeof Renovation

export const ParkingType = {
  none: 'Нет',
  garage: 'Гараж',
  parking_spot: 'Парковочное место',
} as const
export type ParkingType = keyof typeof ParkingType

export const UtilityLevel = {
  none: 'Нет',
  yes: 'Есть',
} as const
export type UtilityLevel = keyof typeof UtilityLevel

export const GasType = {
  none: 'Нет',
  at_boundary: 'По границе участка',
  in_house: 'В доме',
} as const
export type GasType = keyof typeof GasType

export const WaterSupplyType = {
  none: 'Нет',
  central: 'Центральное',
  well: 'Колодец',
  borehole: 'Скважина',
} as const
export type WaterSupplyType = keyof typeof WaterSupplyType

export const SewageType = {
  none: 'Нет',
  central: 'Центральная',
  septic: 'Септик',
  cesspool: 'Выгребная яма',
  bio_station: 'Станция биоочистки',
} as const
export type SewageType = keyof typeof SewageType

export type HouseSpecs = {
  address: string
  latitude: number | null
  longitude: number | null
  object_type: ObjectType | null
  readiness: Readiness | null
  land_category: LandCategory | null
  build_year: number | null
  wall_material: WallMaterial | null
  roof_material: RoofMaterial | null
  floors_count: number | null
  rooms_count: number | null
  plot_area_sotka: number | null
  price_rub: number | null
  cadastral_number: string | null
  distance_to_city_km: number | null
  ceiling_height_m: number | null
  renovation: Renovation | null
  parking: ParkingType | null
  electricity: UtilityLevel | null
  gas: GasType | null
  heating: UtilityLevel | null
  water_supply: WaterSupplyType | null
  sewage: SewageType | null
  has_bathhouse: boolean
  has_pool: boolean
  has_terrace: boolean
  bathroom_in_house: boolean
  bathroom_outside: boolean
  has_wifi: boolean
  has_tv: boolean
  transport_asphalt: boolean
  transport_public_stop: boolean
  transport_railway: boolean
  infra_shop: boolean
  infra_pharmacy: boolean
  infra_kindergarten: boolean
  infra_school: boolean
  is_mortgage_available: boolean
  is_share_sale: boolean
  is_auction: boolean
  has_fence: boolean
  has_security: boolean
}

export const defaultHouseSpecs: HouseSpecs = {
  address: '',
  latitude: null,
  longitude: null,
  object_type: null,
  readiness: null,
  land_category: null,
  build_year: null,
  wall_material: null,
  roof_material: null,
  floors_count: null,
  rooms_count: null,
  plot_area_sotka: null,
  price_rub: null,
  cadastral_number: null,
  distance_to_city_km: null,
  ceiling_height_m: null,
  renovation: null,
  parking: null,
  electricity: null,
  gas: null,
  heating: null,
  water_supply: null,
  sewage: null,
  has_bathhouse: false,
  has_pool: false,
  has_terrace: false,
  bathroom_in_house: false,
  bathroom_outside: false,
  has_wifi: false,
  has_tv: false,
  transport_asphalt: false,
  transport_public_stop: false,
  transport_railway: false,
  infra_shop: false,
  infra_pharmacy: false,
  infra_kindergarten: false,
  infra_school: false,
  is_mortgage_available: false,
  is_share_sale: false,
  is_auction: false,
  has_fence: false,
  has_security: false,
}

export function houseToSpecs(house: Partial<HouseSpecs>): HouseSpecs {
  return {
    ...defaultHouseSpecs,
    ...house,
    latitude: house.latitude != null ? Number(house.latitude) : null,
    longitude: house.longitude != null ? Number(house.longitude) : null,
    plot_area_sotka: house.plot_area_sotka != null ? Number(house.plot_area_sotka) : null,
    distance_to_city_km: house.distance_to_city_km != null ? Number(house.distance_to_city_km) : null,
    ceiling_height_m: house.ceiling_height_m != null ? Number(house.ceiling_height_m) : null,
    price_rub: house.price_rub != null ? Number(house.price_rub) : null,
  }
}
