import {
  GetPackagesByIdApiResponse,
  GetPackagesByIdPerformanceApiResponse,
  GetPackagesByIdUpdatesApiResponse,
} from '../../../api/generated/investorApi';

export type DetailPackageData = GetPackagesByIdApiResponse;
export type PackageInfo = DetailPackageData['package'];
export type AllocationItem = DetailPackageData['allocations'][number];
export type KeyInfoItem = DetailPackageData['keyInfo'][number];
export type DocumentItem = DetailPackageData['documents'][number];
export type ResourceItem = DetailPackageData['resources'][number];
export type GalleryItem = DetailPackageData['galleries'][number];
export type SectionItem = DetailPackageData['sections'][number];
export type FaqItem = DetailPackageData['faqs'][number];
export type PerformanceData = GetPackagesByIdPerformanceApiResponse;
export type UpdateItem = GetPackagesByIdUpdatesApiResponse['items'][number];

export type DetailTab =
  | 'OVERVIEW'
  | 'DETAILS'
  | 'DOCUMENTS'
  | 'GALLERY'
  | 'UPDATES'
  | 'FAQS';