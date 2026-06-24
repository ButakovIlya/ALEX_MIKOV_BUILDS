from enum import StrEnum


class ObjectType(StrEnum):
    HOUSE = "house"
    DACHA = "dacha"
    COTTAGE = "cottage"
    TOWNHOUSE = "townhouse"


class Readiness(StrEnum):
    BUILT = "built"
    UNFINISHED = "unfinished"
    CUSTOM_BUILD = "custom_build"


class LandCategory(StrEnum):
    IZHS = "izhs"
    LPH = "lph"
    DNP = "dnp"
    SNT = "snt"
    AGRICULTURAL = "agricultural"
    OTHER = "other"


class WallMaterial(StrEnum):
    BRICK = "brick"
    BLOCK = "block"
    WOOD = "wood"
    MONOLITH = "monolith"
    FRAME = "frame"
    OTHER = "other"


class Renovation(StrEnum):
    REQUIRED = "required"
    COSMETIC = "cosmetic"
    EURO = "euro"
    DESIGNER = "designer"


class ParkingType(StrEnum):
    NONE = "none"
    GARAGE = "garage"
    PARKING_SPOT = "parking_spot"


class UtilityLevel(StrEnum):
    NONE = "none"
    YES = "yes"


class GasType(StrEnum):
    NONE = "none"
    AT_BOUNDARY = "at_boundary"
    IN_HOUSE = "in_house"


class WaterSupplyType(StrEnum):
    NONE = "none"
    CENTRAL = "central"
    WELL = "well"
    BOREHOLE = "borehole"


class SewageType(StrEnum):
    NONE = "none"
    CENTRAL = "central"
    SEPTIC = "septic"
    CESSPOOL = "cesspool"
    BIO_STATION = "bio_station"


class RoofMaterial(StrEnum):
    METAL = "metal"
    TILE = "tile"
    SOFT = "soft"
    OTHER = "other"
