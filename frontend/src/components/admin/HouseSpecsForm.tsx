import type { HouseSpecs } from '../../api/houseEnums'
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
} from '../../api/houseEnums'
import { AdminCard } from './AdminCard'
import { AddressAutocomplete } from './AddressAutocomplete'
import { CheckboxGroup, SelectField, ToggleGroup } from './ToggleGroup'
import { YandexMapPicker } from './YandexMapPicker'

type HouseSpecsFormProps = {
  specs: HouseSpecs
  onPatch: (patch: Partial<HouseSpecs>) => void
  inputClass: string
}

export function HouseSpecsForm({ specs, onPatch, inputClass }: HouseSpecsFormProps) {
  const patchBool = (key: keyof HouseSpecs, checked: boolean) => onPatch({ [key]: checked } as Partial<HouseSpecs>)

  return (
    <div className="space-y-4">
      <AdminCard title="Расположение" description="Адрес и карта">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-forest">
            Адрес
            <AddressAutocomplete
              value={specs.address}
              onChange={(address) => onPatch({ address })}
              onSelect={(item) =>
                onPatch({
                  address: item.display_name,
                  latitude: item.latitude,
                  longitude: item.longitude,
                })
              }
              inputClass={inputClass}
            />
          </label>
          <YandexMapPicker
            latitude={specs.latitude}
            longitude={specs.longitude}
            onChange={(latitude, longitude) => onPatch({ latitude, longitude })}
          />
        </div>
      </AdminCard>

      <AdminCard title="О доме">
        <div className="grid gap-6">
          <ToggleGroup label="Вид объекта" value={specs.object_type} options={ObjectType} onChange={(v) => onPatch({ object_type: v })} />
          <ToggleGroup label="Готовность" value={specs.readiness} options={Readiness} onChange={(v) => onPatch({ readiness: v })} />
          <CheckboxGroup
            label="Есть на территории"
            items={[
              { key: 'has_bathhouse', label: 'Баня или сауна', checked: specs.has_bathhouse },
              { key: 'has_pool', label: 'Бассейн', checked: specs.has_pool },
            ]}
            onChange={(key, checked) => patchBool(key as keyof HouseSpecs, checked)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Категория земель" value={specs.land_category} options={LandCategory} onChange={(v) => onPatch({ land_category: v })} />
            <label className="block text-sm font-medium text-forest">
              Год постройки
              <input
                type="number"
                value={specs.build_year ?? ''}
                onChange={(e) => onPatch({ build_year: e.target.value ? parseInt(e.target.value, 10) : null })}
                className={inputClass}
              />
            </label>
            <SelectField label="Материал стен" value={specs.wall_material} options={WallMaterial} onChange={(v) => onPatch({ wall_material: v })} />
            <SelectField label="Кровля" value={specs.roof_material} options={RoofMaterial} onChange={(v) => onPatch({ roof_material: v })} />
            <label className="block text-sm font-medium text-forest">
              Этажей
              <input
                type="number"
                value={specs.floors_count ?? ''}
                onChange={(e) => onPatch({ floors_count: e.target.value ? parseInt(e.target.value, 10) : null })}
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium text-forest">
              Комнат
              <input
                type="number"
                value={specs.rooms_count ?? ''}
                onChange={(e) => onPatch({ rooms_count: e.target.value ? parseInt(e.target.value, 10) : null })}
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium text-forest">
              Площадь участка, сот.
              <input
                type="number"
                step="0.1"
                value={specs.plot_area_sotka ?? ''}
                onChange={(e) => onPatch({ plot_area_sotka: e.target.value ? parseFloat(e.target.value) : null })}
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium text-forest">
              Высота потолков, м
              <input
                type="number"
                step="0.01"
                value={specs.ceiling_height_m ?? ''}
                onChange={(e) => onPatch({ ceiling_height_m: e.target.value ? parseFloat(e.target.value) : null })}
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium text-forest">
              До города, км
              <input
                type="number"
                step="0.1"
                value={specs.distance_to_city_km ?? ''}
                onChange={(e) => onPatch({ distance_to_city_km: e.target.value ? parseFloat(e.target.value) : null })}
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium text-forest">
              Кадастровый номер
              <input
                value={specs.cadastral_number ?? ''}
                onChange={(e) => onPatch({ cadastral_number: e.target.value || null })}
                className={inputClass}
              />
            </label>
          </div>
          <CheckboxGroup
            label=""
            items={[{ key: 'has_terrace', label: 'Терраса или веранда', checked: specs.has_terrace }]}
            onChange={(key, checked) => patchBool(key as keyof HouseSpecs, checked)}
          />
        </div>
      </AdminCard>

      <AdminCard title="Удобства и коммуникации">
        <div className="grid gap-6">
          <CheckboxGroup
            label="Санузел"
            items={[
              { key: 'bathroom_in_house', label: 'В доме', checked: specs.bathroom_in_house },
              { key: 'bathroom_outside', label: 'На улице', checked: specs.bathroom_outside },
            ]}
            onChange={(key, checked) => patchBool(key as keyof HouseSpecs, checked)}
          />
          <ToggleGroup label="Ремонт" value={specs.renovation} options={Renovation} onChange={(v) => onPatch({ renovation: v })} />
          <CheckboxGroup
            label="Интернет и ТВ"
            items={[
              { key: 'has_wifi', label: 'Wi-Fi', checked: specs.has_wifi },
              { key: 'has_tv', label: 'Телевидение', checked: specs.has_tv },
            ]}
            onChange={(key, checked) => patchBool(key as keyof HouseSpecs, checked)}
          />
          <ToggleGroup label="Парковка" value={specs.parking} options={ParkingType} onChange={(v) => onPatch({ parking: v })} />
          <CheckboxGroup
            label="Транспортная доступность"
            items={[
              { key: 'transport_asphalt', label: 'Асфальтированная дорога', checked: specs.transport_asphalt },
              { key: 'transport_public_stop', label: 'Остановка ОТ', checked: specs.transport_public_stop },
              { key: 'transport_railway', label: 'Ж/д станция', checked: specs.transport_railway },
            ]}
            onChange={(key, checked) => patchBool(key as keyof HouseSpecs, checked)}
          />
          <CheckboxGroup
            label="Инфраструктура"
            items={[
              { key: 'infra_shop', label: 'Магазин', checked: specs.infra_shop },
              { key: 'infra_pharmacy', label: 'Аптека', checked: specs.infra_pharmacy },
              { key: 'infra_kindergarten', label: 'Детский сад', checked: specs.infra_kindergarten },
              { key: 'infra_school', label: 'Школа', checked: specs.infra_school },
            ]}
            onChange={(key, checked) => patchBool(key as keyof HouseSpecs, checked)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <ToggleGroup label="Электричество" value={specs.electricity} options={UtilityLevel} onChange={(v) => onPatch({ electricity: v })} />
            <ToggleGroup label="Газ" value={specs.gas} options={GasType} onChange={(v) => onPatch({ gas: v })} />
            <ToggleGroup label="Отопление" value={specs.heating} options={UtilityLevel} onChange={(v) => onPatch({ heating: v })} />
            <SelectField label="Водоснабжение" value={specs.water_supply} options={WaterSupplyType} onChange={(v) => onPatch({ water_supply: v })} />
            <SelectField label="Канализация" value={specs.sewage} options={SewageType} onChange={(v) => onPatch({ sewage: v })} />
          </div>
          <CheckboxGroup
            label="Дополнительно"
            items={[
              { key: 'has_fence', label: 'Ограда участка', checked: specs.has_fence },
              { key: 'has_security', label: 'Охрана / сигнализация', checked: specs.has_security },
            ]}
            onChange={(key, checked) => patchBool(key as keyof HouseSpecs, checked)}
          />
        </div>
      </AdminCard>

      <AdminCard title="Условия сделки">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-forest sm:col-span-2">
            Цена, ₽
            <input
              type="number"
              value={specs.price_rub ?? ''}
              onChange={(e) => onPatch({ price_rub: e.target.value ? parseInt(e.target.value, 10) : null })}
              className={inputClass}
              placeholder="0"
            />
          </label>
          <CheckboxGroup
            label="Детали"
            items={[
              { key: 'is_mortgage_available', label: 'Можно в ипотеку', checked: specs.is_mortgage_available },
              { key: 'is_share_sale', label: 'Продажа доли', checked: specs.is_share_sale },
              { key: 'is_auction', label: 'Аукцион', checked: specs.is_auction },
            ]}
            onChange={(key, checked) => patchBool(key as keyof HouseSpecs, checked)}
          />
        </div>
      </AdminCard>
    </div>
  )
}
