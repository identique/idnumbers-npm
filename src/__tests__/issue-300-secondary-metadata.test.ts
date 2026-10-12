/**
 * Issue #300: the secondary ID classes carry the extended metadata the Python library defines.
 * Secondary types are exported from their country module only; they are never registered.
 */
import { getCountryIdFormat, listSupportedCountries, registry } from '../index';
import type { IdMetadata } from '../types';
import { DriverLicenseNumber, TaxFileNumber } from '../countries/aus/index';
import { EntityTaxIDNumber } from '../countries/aut/index';
import { EntityVAT } from '../countries/bel/index';
import { OldNationalID } from '../countries/bgd/index';
import { UnifiedIdCode } from '../countries/bgr/index';
import { RG } from '../countries/bra/index';
import { BusinessID } from '../countries/che/index';
import { IdentityCard, OldIdentityCard } from '../countries/grc/index';
import { BusinessIDNumber } from '../countries/kaz/index';
import { OldResidentRegistration } from '../countries/kor/index';
import { OldPersonalCode } from '../countries/lva/index';
import { IRDNumber } from '../countries/nzl/index';
import { TaxRegistrationNumber } from '../countries/smr/index';
import { EntityID } from '../countries/ukr/index';
import { FiscalInformationNumber } from '../countries/ven/index';

type MetadataClass = { METADATA: IdMetadata; validate(idNumber: string): boolean };

interface Case {
  name: string;
  cls: MetadataClass;
  registryCountry: string;
  primaryIdType: string;
  added: Partial<
    Pick<
      IdMetadata,
      | 'countryName'
      | 'idType'
      | 'officialName'
      | 'displayFormat'
      | 'example'
      | 'checksumAlgorithm'
      | 'masks'
    >
  >;
}

// KOR OldResidentRegistration gets no mask: its minLength/maxLength are 14 (hyphen included) while
// the Python mask has 13 slots, so the #129 length check would fail. Left for a follow-up.
const CASES: Case[] = [
  {
    name: 'aus.DriverLicenseNumber',
    cls: DriverLicenseNumber,
    registryCountry: 'AUS',
    primaryIdType: 'Medicare Number',
    added: {
      countryName: 'Australia',
      idType: 'Driver Licence Number',
      displayFormat: '### ### ###',
      example: '123 456 789',
      masks: [
        '### ### ###',
        '#########',
        '## ### ###',
        '########',
        'L#####',
        '###-###-####',
        '##########',
      ],
    },
  },
  {
    name: 'aus.TaxFileNumber',
    cls: TaxFileNumber,
    registryCountry: 'AUS',
    primaryIdType: 'Medicare Number',
    added: {
      countryName: 'Australia',
      idType: 'Tax File Number',
      displayFormat: '#########',
      example: '123456782',
      checksumAlgorithm:
        'Weighted sum mod 11 (weights 1, 4, 3, 7, 5, 8, 6, 9, 10; the sum must be 0)',
      masks: ['#########', '########'],
    },
  },
  {
    name: 'aut.EntityTaxIDNumber',
    cls: EntityTaxIDNumber,
    registryCountry: 'AUT',
    primaryIdType: 'Tax Identification Number',
    added: {
      countryName: 'Austria',
      idType: 'VAT Identification Number',
      officialName: 'Umsatzsteuer-Identifikationsnummer',
      displayFormat: 'U########',
      example: 'U12345675',
      checksumAlgorithm:
        'Luhn-style mod 10 (every second digit doubled and folded to its digit sum; the sum starts at 4)',
      masks: ['L########', 'L## ### ###'],
    },
  },
  {
    name: 'bel.EntityVAT',
    cls: EntityVAT,
    registryCountry: 'BEL',
    primaryIdType: 'National Registration Number',
    added: {
      countryName: 'Belgium',
      idType: 'VAT Identification Number',
      officialName: 'BTW identificatienummer',
      displayFormat: '0#########',
      example: '0123456749',
      checksumAlgorithm: 'Mod 97 (the last two digits are 97 - (the first eight digits mod 97))',
      masks: ['##########', '#########'],
    },
  },
  {
    name: 'bgd.OldNationalID',
    cls: OldNationalID,
    registryCountry: 'BGD',
    primaryIdType: 'National ID',
    added: {
      officialName: 'জাতীয় পরিচয়পত্র',
      displayFormat: 'DDRPPUUSSSSSS',
      example: '1592824588424',
    },
  },
  {
    name: 'bgr.UnifiedIdCode',
    cls: UnifiedIdCode,
    registryCountry: 'BGR',
    primaryIdType: 'Uniform Civil Number',
    added: {
      countryName: 'Bulgaria',
      idType: 'Unified Identification Code',
      officialName: 'Единен идентификационен код',
      displayFormat: '#########[####]',
      example: '123456786',
      checksumAlgorithm:
        'Weighted sum mod 11 in two passes (weights 1-8, then 3-10; a remainder of 10 in both passes becomes 0); the 13th digit of a 13-digit code uses weights 2, 7, 3, 5 then 4, 9, 5, 7',
      masks: ['#########', '#############'],
    },
  },
  {
    name: 'bra.RG',
    cls: RG,
    registryCountry: 'BRA',
    primaryIdType: 'CPF Number',
    added: {
      countryName: 'Brazil',
      idType: 'General Registry Number',
      officialName: 'Registro Geral',
      displayFormat: '##.###.###-X',
      example: '12.345.678-2',
      checksumAlgorithm:
        'Library convention: weights 2-9 over the first eight digits; check value is the complement of the sum modulo 11 (remainder 0 gives 0, remainder 1 gives X; X counts as 10)',
      masks: ['##.###.###-X'],
    },
  },
  {
    name: 'che.BusinessID',
    cls: BusinessID,
    registryCountry: 'CHE',
    primaryIdType: 'Social Security Number',
    added: {
      countryName: 'Switzerland',
      idType: 'Business Identification Number',
      officialName: 'Unternehmens-Identifikationsnummer',
      displayFormat: 'CHE-###.###.###',
      example: 'CHE-123.456.788',
      masks: ['LLL-###.###.###', 'LLL#########'],
    },
  },
  {
    name: 'grc.IdentityCard',
    cls: IdentityCard,
    registryCountry: 'GRC',
    primaryIdType: 'Tax Identity Number',
    added: {
      countryName: 'Greece',
      idType: 'Identity Card Number',
      officialName: 'Δελτίο Ταυτότητας',
      displayFormat: 'LL-######',
      example: 'AB-123456',
      masks: ['LL-######', 'LL######'],
    },
  },
  {
    name: 'grc.OldIdentityCard',
    cls: OldIdentityCard,
    registryCountry: 'GRC',
    primaryIdType: 'Tax Identity Number',
    added: {
      countryName: 'Greece',
      idType: 'Identity Card Number (Old)',
      officialName: 'Δελτίο Ταυτότητας',
      displayFormat: 'L-######',
      example: 'Χ-123456',
      masks: ['L-######', 'L######'],
    },
  },
  {
    name: 'kaz.BusinessIDNumber',
    cls: BusinessIDNumber,
    registryCountry: 'KAZ',
    primaryIdType: 'Individual Identification Number',
    added: {
      countryName: 'Kazakhstan',
      idType: 'Business Identification Number',
      officialName: 'Бизнес-идентификационный номер',
      displayFormat: 'YYMMTDSSSSSC',
      example: '100140000003',
      checksumAlgorithm:
        'Weighted sum mod 11 (weights 1-11; with a remainder of 10 the weights 3-11, 1, 2 are used and a second 10 is invalid)',
      masks: ['############'],
    },
  },
  {
    name: 'kor.OldResidentRegistration',
    cls: OldResidentRegistration,
    registryCountry: 'KOR',
    primaryIdType: 'Resident Registration Number',
    added: {
      countryName: 'South Korea',
      idType: 'Resident Registration Number (Old)',
      officialName: '주민등록번호',
      displayFormat: 'YYMMDD-GLLLLSC',
      example: '800101-1234560',
      checksumAlgorithm:
        'Weighted sum mod 11 (weights 2-9, then 2-5 over the first twelve digits; check = 11 - remainder, reduced to its last digit)',
    },
  },
  {
    name: 'lva.OldPersonalCode',
    cls: OldPersonalCode,
    registryCountry: 'LVA',
    primaryIdType: 'Personal Code',
    added: {
      countryName: 'Latvia',
      idType: 'Personal Code (Old)',
      officialName: 'personas kods',
      displayFormat: 'DDMMYY-CSSSK',
      example: '161175-19997',
      checksumAlgorithm:
        '(1101 - weighted sum) mod 11 mod 10 (weights 1, 6, 3, 7, 9, 10, 5, 8, 4, 2)',
      masks: ['######-#####', '###########'],
    },
  },
  {
    name: 'nzl.IRDNumber',
    cls: IRDNumber,
    registryCountry: 'NZL',
    primaryIdType: 'Driver Licence Number',
    added: {
      countryName: 'New Zealand',
      idType: 'Inland Revenue Department Number',
      displayFormat: '##-###-###',
      example: '49-091-850',
      checksumAlgorithm:
        'Weighted sum mod 11 in two passes (weights 3, 2, 7, 6, 5, 4, 3, 2; then 7, 4, 3, 2, 5, 2, 7, 6 when the first check digit is 10)',
      masks: ['##-###-###', '###-###-###', '########', '#########'],
    },
  },
  {
    name: 'smr.TaxRegistrationNumber',
    cls: TaxRegistrationNumber,
    registryCountry: 'SMR',
    primaryIdType: 'Social Security Number / Tax Registration',
    added: {
      countryName: 'San Marino',
      idType: 'Entity Tax Registration Number',
      officialName: 'Codice Operatore Economico',
      displayFormat: 'SM#####',
      example: 'SM12345',
    },
  },
  {
    name: 'ukr.EntityID',
    cls: EntityID,
    registryCountry: 'UKR',
    primaryIdType: 'Individual Tax Number',
    added: {
      countryName: 'Ukraine',
      idType: 'Legal Entity ID Number',
      officialName: 'Код ЄДРПОУ',
      displayFormat: '########',
      example: '32000001',
      checksumAlgorithm:
        'Weighted sum mod 11 (weights 1-7, or 7 then 1-6 when the first digit is 3 to 6; a remainder of 10 retries with every weight raised by 2)',
      masks: ['########'],
    },
  },
  {
    name: 'ven.FiscalInformationNumber',
    cls: FiscalInformationNumber,
    registryCountry: 'VEN',
    primaryIdType: 'Cédula de Identidad',
    added: {
      countryName: 'Venezuela',
      idType: 'Fiscal Information Number',
      officialName: 'Registro de Información Fiscal',
      displayFormat: 'L-########-#',
      example: 'J-12345678-4',
      checksumAlgorithm:
        'Weighted sum mod 11 (weights 1, 3, 2, 7, 6, 5, 4, 3, 2 with the type letter V, E, J, P, G counted as 4, 8, 12, 16, 20; check = 11 - remainder, values above 9 become 0)',
      masks: ['L-########-#', 'L#########'],
    },
  },
];

const SLOT_CHARS = /[#LX*]/g;

describe('Issue #300: metadata of the secondary ID classes', () => {
  it('covers 17 classes and 105 added fields', () => {
    expect(CASES).toHaveLength(17);
    expect(CASES.reduce((sum, c) => sum + Object.keys(c.added).length, 0)).toBe(105);
  });

  it('describes no check digit for CHE BusinessID, which does not verify one yet (#262)', () => {
    const metadata: IdMetadata = BusinessID.METADATA;
    expect(metadata.checksum).toBe(false);
    expect(metadata.checksumAlgorithm).toBeUndefined();
    expect('checksumAlgorithm' in metadata).toBe(false);
  });

  describe.each(CASES)('$name', ({ cls, added, registryCountry, primaryIdType }) => {
    it('carries the added fields', () => {
      expect(cls.METADATA).toMatchObject(added);
    });

    it('validates its own example', () => {
      const { example } = cls.METADATA;
      if (example !== undefined) {
        expect(cls.validate(example)).toBe(true);
      }
    });

    it('has masks in the #129 vocabulary that fit the example', () => {
      const { masks, example } = cls.METADATA;
      if (masks === undefined) return;
      expect(masks.length).toBeGreaterThan(0);
      expect(new Set(masks).size).toBe(masks.length);
      const slotCounts = masks.map(mask => {
        expect(mask).not.toBe('');
        return mask.match(SLOT_CHARS)?.length ?? 0;
      });
      if (example === undefined) return;
      // Shape check by length only: `L` stands for a letter in any alphabet or a fixed prefix.
      const matches = masks.some((mask, i) => {
        const separators = new Set(mask.replace(SLOT_CHARS, '').split(''));
        const stripped = [...example].filter(ch => !separators.has(ch));
        return stripped.length === slotCounts[i];
      });
      expect(matches).toBe(true);
    });

    it('is not registered: the country keeps its primary ID type', () => {
      expect(getCountryIdFormat(registryCountry)?.idType).toBe(primaryIdType);
      for (const key of registry.listAll()) {
        expect(registry.get(key)?.METADATA).not.toBe(cls.METADATA);
      }
    });
  });

  it('leaves the registry at 85 countries', () => {
    expect(listSupportedCountries()).toHaveLength(85);
  });
});
