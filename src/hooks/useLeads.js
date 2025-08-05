// hooks/useLeads.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTable, createTable, updateTabled, deleteLead } from "../api/crud.js";
import { useState } from 'react';

export const useLeads = (TABLE_NAME, SELECT_FIELDS, fetchOptions = {}) => {
  
  const queryClient = useQueryClient();
  const [leads, setLeads] = useState([]);
  
  // Default fetch options with increased limit
  const defaultFetchOptions = {
    limit: 2000, // UPDATED: Increased from default to 2000
    orderBy: 'timestamp',
    orderDirection: 'desc',
    ...fetchOptions // Allow override of default options
  };
  
  // Query for fetching leads
  const leadsQuery = useQuery({
    queryKey: [TABLE_NAME, defaultFetchOptions], // Include fetch options in query key for proper caching
    queryFn: () => getTable({
      table: TABLE_NAME,
      selectFields: SELECT_FIELDS,
      filters: [], // Add any default filters here if needed
      ...defaultFetchOptions // UPDATED: Pass the fetch options to getTable
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Mutation for creating leads
  const createLeadMutation = useMutation({
    mutationFn: (leadData) => {
      // Remove user_id from leadData if it exists
      //const { user_id, ...cleanLeadData } = leadData;
      return createTable(TABLE_NAME, leadData);
    },
    onSuccess: (newLead) => {
      // Optimistically update the cache
      queryClient.setQueryData([TABLE_NAME, defaultFetchOptions], (oldData) => {
        return [newLead, ...(oldData || [])];
      });
      // Also invalidate to ensure sync with server
      queryClient.invalidateQueries([TABLE_NAME]);
    },
    onError: (error) => {
      console.error('Error creating lead:', error);
      // You can add toast notifications here
    },
  });

  // Mutation for updating leads
  const updateLeadMutation = useMutation({
    mutationFn: ({ id, ...updates }) => {
      // Remove user_id from updates if it exists
      const { user_id, ...cleanUpdates } = updates;
      return updateTabled({
        table: TABLE_NAME,
        id: id,
        updates: cleanUpdates
      });
    },
    onMutate: async (updatedLead) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries([TABLE_NAME]);
      
      // Snapshot the previous value
      const previousLeads = queryClient.getQueryData([TABLE_NAME, defaultFetchOptions]);
      
      // Optimistically update to the new value
      queryClient.setQueryData([TABLE_NAME, defaultFetchOptions], (oldData) => {
        return oldData?.map(lead => 
          lead.id === updatedLead.id ? { ...lead, ...updatedLead } : lead
        ) || [];
      });
      
      return { previousLeads };
    },
    onError: (err, updatedLead, context) => {
      // Rollback on error
      queryClient.setQueryData([TABLE_NAME, defaultFetchOptions], context.previousLeads);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries([TABLE_NAME]);
    },
  });

  // Mutation for deleting leads
  const deleteLeadMutation = useMutation({
    mutationFn: (id) => deleteLead(TABLE_NAME, id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries([TABLE_NAME]);
      
      const previousLeads = queryClient.getQueryData([TABLE_NAME, defaultFetchOptions]);
      
      // Optimistically remove from cache
      queryClient.setQueryData([TABLE_NAME, defaultFetchOptions], (oldData) => {
        return oldData?.filter(lead => lead.id !== deletedId) || [];
      });
      
      return { previousLeads };
    },
    onError: (err, deletedId, context) => {
      // Rollback on error
      queryClient.setQueryData([TABLE_NAME, defaultFetchOptions], context.previousLeads);
    },
    onSettled: () => {
      queryClient.invalidateQueries([TABLE_NAME]);
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      const deletePromises = ids.map(id => deleteLead(TABLE_NAME, id));
      await Promise.all(deletePromises);
      return ids;
    },
    onSuccess: () => {
      queryClient.invalidateQueries([TABLE_NAME]);
    },
    onError: (error) => {
      console.error('Error in bulk delete:', error);
    },
  });

  return {
    // Query data and states
    leads: leadsQuery.data || [],
    isLoading: leadsQuery.isLoading,
    isError: leadsQuery.isError,
    error: leadsQuery.error,
    isFetching: leadsQuery.isFetching,
    refetch: leadsQuery.refetch,

    // Mutations
    createLead: createLeadMutation.mutate,
    updateLead: updateLeadMutation.mutate,
    deleteLead: deleteLeadMutation.mutate,
    bulkDelete: bulkDeleteMutation.mutate,

    // Mutation states
    isCreating: createLeadMutation.isLoading,
    isUpdating: updateLeadMutation.isLoading,
    isDeleting: deleteLeadMutation.isLoading,
    isBulkDeleting: bulkDeleteMutation.isLoading,

    // Error states
    createError: createLeadMutation.error,
    updateError: updateLeadMutation.error,
    deleteError: deleteLeadMutation.error,
    bulkDeleteError: bulkDeleteMutation.error,

    // UPDATED: Expose fetch options for debugging
    fetchOptions: defaultFetchOptions,
  };
};