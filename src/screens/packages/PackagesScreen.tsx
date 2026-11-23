import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import { AppHeader } from '../../components/common/AppHeader';
import { RootStackParamList } from '../../navigation/types';
import {
  investorApi,
  useGetPackagesQuery,
  useGetKycMeQuery,
} from '../../api/generated/investorApi';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { PackageCard, PackageItem } from '../../components/packages/PackageCard';
import {
  PackageSearchFilter,
  PackageFilterType,
  SortKey,
} from '../../components/packages/PackageSearchFilter';
import { PackageEmptyState } from '../../components/packages/PackageEmptyState';
import { prefetchMediaUrls } from '../../utils/mediaCache';

const ITEM_TOTAL_HEIGHT = 380 + 18;

function roiSortValue(pkg: PackageItem): number {
  const value = pkg.roiMax ?? pkg.roiMin;
  return value ? Number(value) : -Infinity;
}

function sortPackages(packages: PackageItem[], sort: SortKey): PackageItem[] {
  const copy = [...packages];
  switch (sort) {
    case 'minInvestmentAsc':
      return copy.sort((a, b) => Number(a.minInvestment) - Number(b.minInvestment));
    case 'minInvestmentDesc':
      return copy.sort((a, b) => Number(b.minInvestment) - Number(a.minInvestment));
    case 'roiDesc':
      return copy.sort((a, b) => roiSortValue(b) - roiSortValue(a));
    default:
      return copy.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }
}

export const PackagesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch();

  const { data, isLoading, isFetching, error, refetch } = useGetPackagesQuery(
    undefined,
    { refetchOnMountOrArgChange: 120 }
  );
  const { data: kycData } = useGetKycMeQuery(undefined, {
    refetchOnMountOrArgChange: 60,
  });

  const isKycApproved = kycData?.status?.toLowerCase() === 'approved';
  const packagesList: PackageItem[] = data?.packages || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<PackageFilterType>('ALL');
  const [sort, setSort] = useState<SortKey>('name');

  useEffect(() => {
    if (packagesList.length === 0) return;
    const coverUrls = packagesList.map((p) => p.coverImageViewUrl);
    prefetchMediaUrls(coverUrls);

    packagesList.slice(0, 4).forEach((pkg) => {
      dispatch(
        investorApi.endpoints.getPackagesById.initiate(
          { id: pkg.id },
          { subscribe: false, forceRefetch: false }
        ) as any
      );
    });
  }, [packagesList, dispatch]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const filteredPackages = useMemo(() => {
    const filtered = packagesList.filter((pkg) => {
      if (filter === 'DYNAMIC' && !pkg.isDynamic) return false;
      if (filter === 'FIXED' && pkg.isDynamic) return false;

      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = pkg.name?.toLowerCase().includes(query);
        const matchesSubtitle = pkg.subtitle?.toLowerCase().includes(query);
        const matchesOptions = pkg.payoutOptions?.some((opt) =>
          opt.toLowerCase().includes(query)
        );
        return matchesName || matchesSubtitle || matchesOptions;
      }

      return true;
    });
    return sortPackages(filtered, sort);
  }, [packagesList, filter, searchQuery, sort]);

  const handlePackagePress = useCallback(
    (pkg: PackageItem) => {
      const parentNav = navigation.getParent() as
        | { navigate: (name: string, params?: Record<string, unknown>) => void }
        | undefined;
      if (parentNav?.navigate) {
        parentNav.navigate('PackageDetail', { id: pkg.id });
      } else {
        navigation.navigate('PackageDetail', { id: pkg.id });
      }
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: { item: PackageItem }) => (
      <PackageCard
        item={item}
        isKycApproved={isKycApproved}
        onPress={handlePackagePress}
      />
    ),
    [isKycApproved, handlePackagePress]
  );

  const keyExtractor = useCallback((pkg: PackageItem) => pkg.id, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_TOTAL_HEIGHT,
      offset: ITEM_TOTAL_HEIGHT * index,
      index,
    }),
    []
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <AppHeader title="Opportunities" subtitle="Vetted institutional real estate" />

      {/* Header Banner */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerKicker}>OPPORTUNITIES MARKETPLACE</Text>
          <Text style={styles.headerTitle}>Investment packages</Text>
        </View>
        <View style={styles.dealCountBadge}>
          <Text style={styles.dealCountNumber}>{filteredPackages.length}</Text>
          <Text style={styles.dealCountLabel}>Active</Text>
        </View>
      </View>

      {/* Search Bar & Filter Strip */}
      <PackageSearchFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filter={filter}
        setFilter={setFilter}
        sort={sort}
        setSort={setSort}
      />

      {/* Body States */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching institutional packages...</Text>
        </View>
      ) : error || filteredPackages.length === 0 ? (
        <PackageEmptyState
          isError={Boolean(error)}
          searchQuery={searchQuery}
          onRetry={() => {
            if (searchQuery) setSearchQuery('');
            handleRefresh();
          }}
        />
      ) : (
        <FlatList
          data={filteredPackages}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={3}
          maxToRenderPerBatch={3}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'android' ? 24 : 12,
    paddingBottom: 8,
    backgroundColor: '#F8F7F4',
  },
  headerKicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.primary,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.text,
    marginTop: 2,
  },
  dealCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  dealCountNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  dealCountLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: 4,
    paddingBottom: spacing.xxl + 48,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
