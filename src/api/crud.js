import { supabase } from '../../supabaseClient';

export const getTable = async ({
  table,
  selectFields = '*',
  filters = []
}) => {
  let query = supabase.from(table).select(selectFields);

  
  filters.forEach(({ column, operator = 'neq', value }) => {
    if (query[operator]) {
      query = query[operator](column, value);
    }
  });

  

  const { data, error } = await query;
  if (error) throw error;
  return data;
};


export const createTable = async (table,lead) => {
  const { data, error } = await supabase.from(table).insert([lead]).select().single();
  if (error) throw error;
  return data;
};

export const updateTabled = async ({ table,id,updates }) => {
  const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

export const deleteLead = async (table,id) => {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
  return id;
};