import type { ReactNode } from 'react'
import {
  GasType,
  LandCategory,
  ObjectType,
  ParkingType,
  Readiness,
  Renovation,
  RoofMaterial,
  SewageType,
  UtilityLevel,
  WallMaterial,
  WaterSupplyType,
  type HouseSpecs,
} from '../../api/houseEnums'
import type { House } from '../../api/client'
import { YandexMapPicker } from '../admin/YandexMapPicker'

function enumLabel(map: Record<string, string>, key: string | null | undefined) {
  if (!key || key === 'none') return null
  return map[key] ?? key
}

function SpecRow({ label, value }: { label: string; value: ReactNode | null | undefined | false }) {
  if (value == null || value === false || value === '') return null
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-gold/10 py-3 sm:grid-cols-2 sm:gap-4">
      <dt className="text-sm text-stone">{label}</dt>
      <dd className="text-sm font-medium text-forest">{value}</dd>
    </div>
  )
}

function SpecSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-gold/15 pb-6">
      <h2 className="mb-3 font-display text-xl text-forest">{title}</h2>
      <dl>{children}</dl>
    </section>
  )
}

function boolList(flags: { label: string; on: boolean }[]) {
  const active = flags.filter((f) => f.on).map((f) => f.label)
  if (!active.length) return null
  return active.join(', ')
}

export function buildListingTitle(house: House) {
  const type = house.object_type ? ObjectType[house.object_type] : 'Объект'
  const parts = [type]
  if (house.area_sqm) parts.push(`${house.area_sqm} м²`)
  if (house.plot_area_sotka) parts.push(`на участке ${house.plot_area_sotka} сот.`)
  return parts.join(' ')
}

export function HouseSpecsDisplay({ house }: { house: House }) {
  const s = house as House & HouseSpecs

  const leisure = boolList([
    { label: 'баня или сауна', on: s.has_bathhouse },
    { label: 'бассейн', on: s.has_pool },
    { label: 'терраса', on: s.has_terrace },
  ])

  const bathroom = boolList([
    { label: 'в доме', on: s.bathroom_in_house },
    { label: 'на улице', on: s.bathroom_outside },
  ])

  const comfort = boolList([
    { label: 'Wi‑Fi', on: s.has_wifi },
    { label: 'ТВ', on: s.has_tv },
  ])

  const transport = boolList([
    { label: 'асфальтированный подъезд', on: s.transport_asphalt },
    { label: 'остановка общественного транспорта', on: s.transport_public_stop },
    { label: 'ж/д станция', on: s.transport_railway },
  ])

  const infra = boolList([
    { label: 'магазин', on: s.infra_shop },
    { label: 'аптека', on: s.infra_pharmacy },
    { label: 'детский сад', on: s.infra_kindergarten },
    { label: 'школа', on: s.infra_school },
  ])

  const deal = boolList([
    { label: 'ипотека', on: s.is_mortgage_available },
    { label: 'продажа доли', on: s.is_share_sale },
    { label: 'аукцион', on: s.is_auction },
    { label: 'забор', on: s.has_fence },
    { label: 'охрана', on: s.has_security },
  ])

  const hasAbout =
    s.object_type ||
    s.rooms_count ||
    house.area_sqm ||
    s.plot_area_sotka ||
    s.floors_count ||
    s.readiness ||
    s.build_year ||
    s.land_category ||
    s.wall_material ||
    s.roof_material ||
    s.ceiling_height_m ||
    s.renovation ||
    s.cadastral_number ||
    s.distance_to_city_km != null

  const hasUtilities =
    s.electricity ||
    s.gas ||
    s.heating ||
    s.water_supply ||
    s.sewage ||
    s.parking

  return (
    <div className="space-y-8">
      {hasAbout && (
        <SpecSection title="О доме">
          <SpecRow label="Тип объекта" value={enumLabel(ObjectType, s.object_type)} />
          <SpecRow label="Количество комнат" value={s.rooms_count} />
          <SpecRow label="Площадь дома" value={house.area_sqm ? `${house.area_sqm} м²` : null} />
          <SpecRow label="Площадь участка" value={s.plot_area_sotka ? `${s.plot_area_sotka} сот.` : null} />
          <SpecRow label="Этажей в доме" value={s.floors_count} />
          <SpecRow label="Готовность" value={enumLabel(Readiness, s.readiness)} />
          <SpecRow label="Год постройки" value={s.build_year} />
          <SpecRow label="Категория земель" value={enumLabel(LandCategory, s.land_category)} />
          <SpecRow label="Материал стен" value={enumLabel(WallMaterial, s.wall_material)} />
          <SpecRow label="Кровля" value={enumLabel(RoofMaterial, s.roof_material)} />
          <SpecRow label="Высота потолков" value={s.ceiling_height_m ? `${s.ceiling_height_m} м` : null} />
          <SpecRow label="Ремонт" value={enumLabel(Renovation, s.renovation)} />
          <SpecRow label="Кадастровый номер" value={s.cadastral_number} />
          <SpecRow
            label="Расстояние до города"
            value={s.distance_to_city_km != null ? `${s.distance_to_city_km} км` : null}
          />
        </SpecSection>
      )}

      {(leisure || bathroom || comfort) && (
        <SpecSection title="Удобства">
          <SpecRow label="Для отдыха" value={leisure} />
          <SpecRow label="Санузел" value={bathroom} />
          <SpecRow label="Интернет и ТВ" value={comfort} />
        </SpecSection>
      )}

      {hasUtilities && (
        <SpecSection title="Коммуникации">
          <SpecRow label="Электричество" value={enumLabel(UtilityLevel, s.electricity)} />
          <SpecRow label="Газ" value={enumLabel(GasType, s.gas)} />
          <SpecRow label="Отопление" value={enumLabel(UtilityLevel, s.heating)} />
          <SpecRow label="Водоснабжение" value={enumLabel(WaterSupplyType, s.water_supply)} />
          <SpecRow label="Канализация" value={enumLabel(SewageType, s.sewage)} />
          <SpecRow label="Парковка" value={enumLabel(ParkingType, s.parking)} />
        </SpecSection>
      )}

      {(transport || infra) && (
        <SpecSection title="Транспорт и инфраструктура">
          <SpecRow label="Транспортная доступность" value={transport} />
          <SpecRow label="Инфраструктура рядом" value={infra} />
        </SpecSection>
      )}

      {deal && (
        <SpecSection title="Условия сделки">
          <SpecRow label="Особые условия" value={deal} />
        </SpecSection>
      )}

      {(s.address || house.location) && (
        <SpecSection title="Расположение">
          {house.location && <SpecRow label="Регион" value={house.location} />}
          {s.address && <SpecRow label="Адрес" value={s.address} />}
          {s.latitude != null && s.longitude != null && (
            <div className="mt-4">
              <YandexMapPicker
                className="border border-gold/20"
                latitude={Number(s.latitude)}
                longitude={Number(s.longitude)}
                onChange={() => {}}
                readOnly
              />
            </div>
          )}
        </SpecSection>
      )}

      {house.description && (
        <section>
          <h2 className="mb-3 font-display text-xl text-forest">Описание</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone md:text-base">{house.description}</p>
        </section>
      )}
    </div>
  )
}
