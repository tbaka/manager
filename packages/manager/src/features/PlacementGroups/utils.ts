import { AFFINITY_TYPES } from '@linode/api-v4/lib/placement-groups';

import type {
  AffinityEnforcement,
  CreatePlacementGroupPayload,
  Linode,
  PlacementGroup,
  Region,
} from '@linode/api-v4';

/**
 * Helper to get the affinity enforcement readable string.
 */
export const getAffinityTypeEnforcement = (
  is_strict: boolean
): AffinityEnforcement => {
  return is_strict ? 'Strict' : 'Flexible';
};

/**
 * Helper to get the full linodes objects assigned to a Placement Group.
 */
export const getPlacementGroupLinodes = (
  placementGroup: PlacementGroup | undefined,
  linodes: Linode[] | undefined
) => {
  if (!placementGroup || !linodes) {
    return;
  }

  return linodes.filter((linode) =>
    placementGroup.members.some((pgLinode) => pgLinode.linode_id === linode.id)
  );
};

interface HasPlacementGroupReachedCapacityOptions {
  placementGroup: PlacementGroup | undefined;
  region: Region | undefined;
}

/**
 * Helper to determine if a Placement Group has reached its linode capacity.
 *
 * based on the region's `maximum_linodes_per_pg`.
 */
export const hasPlacementGroupReachedCapacity = ({
  placementGroup,
  region,
}: HasPlacementGroupReachedCapacityOptions): boolean => {
  if (!placementGroup || !region) {
    return false;
  }

  return (
    placementGroup.members.length >=
    region.placement_group_limits.maximum_linodes_per_pg
  );
};

interface HasRegionReachedPlacementGroupCapacityOptions {
  allPlacementGroups: PlacementGroup[] | undefined;
  region: Region | undefined;
}

/**
 * Helper to determine if a region has reached its placement group capacity.
 *
 * based on the region's `maximum_pgs_per_customer`.
 */
export const hasRegionReachedPlacementGroupCapacity = ({
  allPlacementGroups,
  region,
}: HasRegionReachedPlacementGroupCapacityOptions): boolean => {
  if (!region?.placement_group_limits || !allPlacementGroups) {
    return false;
  }

  const { placement_group_limits } = region;
  const { maximum_pgs_per_customer } = placement_group_limits;
  const placementGroupsInRegion = allPlacementGroups.filter(
    (pg) => pg.region === region.id
  );

  return (
    placementGroupsInRegion.length >= maximum_pgs_per_customer ||
    maximum_pgs_per_customer === 0
  );
};

/**
 * Helper to populate the affinity_type select options.
 */
export const affinityTypeOptions = Object.entries(AFFINITY_TYPES).map(
  ([key, value]) => ({
    disabled: false,
    label: value,
    value: key as CreatePlacementGroupPayload['affinity_type'],
  })
);

/**
 * Helper to get all linodes assigned to any placement group. (and reduce to unique linodes)
 * This is useful for determining which linodes are available to be assigned.
 */
export const getLinodesFromAllPlacementGroups = (
  allPlacementGroups: PlacementGroup[] | undefined
) => {
  if (!allPlacementGroups) {
    return [];
  }

  const linodeIds = allPlacementGroups.reduce((acc, placementGroup) => {
    return [
      ...acc,
      ...placementGroup.members.map((member) => member.linode_id),
    ];
  }, []);

  return Array.from(new Set(linodeIds));
};
