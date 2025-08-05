import { supabase } from '../../supabaseClient';

export const getTable = async ({
  table,
  selectFields = '*',
  filters = [],
  limit = 2000, // Target limit (we'll fetch in batches to reach this)
  orderBy = 'id',
  orderDirection = 'asc',
  offset = 0
}) => {
  // CRITICAL FIX: Supabase has a hard limit of 1000 rows per query
  // To get more than 1000 records, we need to use pagination
  
  if (limit <= 1000) {
    // Simple case: can fetch in one query
    let query = supabase.from(table).select(selectFields);
    
    filters.forEach(({ column, operator = 'neq', value }) => {
      if (query[operator]) {
        query = query[operator](column, value);
      }
    });
    
    if (orderBy) {
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });
    }
    
    query = query.range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    if (error) throw error;
    
    console.log(`Fetched ${data?.length || 0} records from ${table} (single query)`);
    return data;
  } else {
    // UPDATED: For limits > 1000, fetch in batches of 1000
    const allData = [];
    const batchSize = 1000;
    let currentOffset = offset;
    let remainingLimit = limit;
    
    while (remainingLimit > 0 && allData.length < limit) {
      const currentBatchSize = Math.min(batchSize, remainingLimit);
      
      let query = supabase.from(table).select(selectFields);
      
      filters.forEach(({ column, operator = 'neq', value }) => {
        if (query[operator]) {
          query = query[operator](column, value);
        }
      });
      
      if (orderBy) {
        query = query.order(orderBy, { ascending: orderDirection === 'asc' });
      }
      
      query = query.range(currentOffset, currentOffset + currentBatchSize - 1);
      
      const { data, error } = await query;
      if (error) throw error;
      
      console.log(`Batch fetch: ${data?.length || 0} records (offset: ${currentOffset})`);
      
      if (!data || data.length === 0) {
        // No more data available
        break;
      }
      
      allData.push(...data);
      currentOffset += currentBatchSize;
      remainingLimit -= data.length;
      
      // If we got less than the batch size, we've reached the end
      if (data.length < currentBatchSize) {
        break;
      }
    }
    
    console.log(`✅ Total fetched: ${allData.length} records from ${table} (target: ${limit})`);
    return allData;
  }
};

export const createTable = async (table, lead) => {
  const { data, error } = await supabase.from(table).insert([lead]).select().single();
  if (error) throw error;
  return data;
};

export const updateTabled = async ({ table, id, updates }) => {
  const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

export const deleteLead = async (table, id) => {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
  return id;
};