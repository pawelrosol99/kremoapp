import { supabase } from './supabase';
import { User } from '../types';

// Function to authenticate a user
export async function authenticateUser(login: string, password: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('login', login)
      .single();

    if (error || !data) {
      throw new Error('Nieprawidłowy login lub hasło');
    }

    // In a real application, you would use a secure password comparison
    // This is simplified for demonstration purposes
    if (data.password !== password) {
      throw new Error('Nieprawidłowy login lub hasło');
    }

    // Log successful login
    await logActivity(data.id, 'login', 'users', data.id, `User ${login} logged in`);

    return data as User;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Function to get the user's role
export async function getUserRole(userId: number): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw error;
    }

    return data.role;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

// Log activity for audit purposes
export async function logActivity(userId: number, action: string, entityType: string, entityId?: number, details?: string) {
  try {
    await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: userId,
          action,
          entity_type: entityType,
          entity_id: entityId,
          details
        }
      ]);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}
