import { supabase, supabaseAdmin } from './config';
import type {
  TriageSession,
  ChatMessage,
  UserProfile,
  NewTriageSession,
  NewChatMessage,
  NewUserProfile,
  AppointmentBooking,
  NewAppointmentBooking,
  MedicalReference
} from './types';

// User Profile Services
export const userProfileService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    return data;
  },

  async createProfile(profile: NewUserProfile): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(profile)
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
    return data;
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
    return data;
  }
};

// Triage Session Services
export const triageSessionService = {
  async createSession(session: NewTriageSession): Promise<TriageSession | null> {
    const { data, error } = await supabase
      .from('triage_sessions')
      .insert(session)
      .select()
      .single();

    if (error) {
      console.error('Error creating triage session:', error);
      return null;
    }
    return data;
  },

  async getSession(sessionId: string): Promise<TriageSession | null> {
    const { data, error } = await supabase
      .from('triage_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching triage session:', error);
      return null;
    }
    return data;
  },

  async updateSession(sessionId: string, updates: Partial<TriageSession>): Promise<TriageSession | null> {
    const { data, error } = await supabase
      .from('triage_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating triage session:', error);
      return null;
    }
    return data;
  },

  async getUserSessions(userId: string, limit = 10): Promise<TriageSession[]> {
    const { data, error } = await supabase
      .from('triage_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user sessions:', error);
      return [];
    }
    return data || [];
  },

  async getRecentSessions(userId: string, limit = 10) {
    const { data, error } = await supabase
      .rpc('get_user_recent_sessions', {
        user_uuid: userId,
        limit_count: limit
      });

    if (error) {
      console.error('Error fetching recent sessions:', error);
      return [];
    }
    return data || [];
  }
};

// Chat Message Services
export const chatMessageService = {
  async addMessage(message: NewChatMessage): Promise<ChatMessage | null> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert(message)
      .select()
      .single();

    if (error) {
      console.error('Error adding chat message:', error);
      return null;
    }
    return data;
  },

  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching session messages:', error);
      return [];
    }
    return data || [];
  },

  async deleteMessage(messageId: string): Promise<boolean> {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting chat message:', error);
      return false;
    }
    return true;
  }
};

// Appointment Booking Services
export const appointmentService = {
  async createBooking(booking: NewAppointmentBooking): Promise<AppointmentBooking | null> {
    const { data, error } = await supabase
      .from('appointment_bookings')
      .insert(booking)
      .select()
      .single();

    if (error) {
      console.error('Error creating appointment booking:', error);
      return null;
    }
    return data;
  },

  async getUserBookings(userId: string): Promise<AppointmentBooking[]> {
    const { data, error } = await supabase
      .from('appointment_bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user bookings:', error);
      return [];
    }
    return data || [];
  },

  async updateBookingStatus(bookingId: string, status: string): Promise<AppointmentBooking | null> {
    const { data, error } = await supabase
      .from('appointment_bookings')
      .update({ status })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking status:', error);
      return null;
    }
    return data;
  }
};

// Medical Reference Services
export const medicalReferenceService = {
  async create(reference: Partial<MedicalReference>): Promise<MedicalReference> {
    const { data, error } = await supabase
      .from('medical_references')
      .insert({
        ...reference,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating medical reference:', error);
      throw error;
    }
    return data;
  },

  async searchReferences(query: string, documentType?: string): Promise<MedicalReference[]> {
    let queryBuilder = supabase
      .from('medical_references')
      .select('*')
      .eq('is_active', true)
      .textSearch('content', query);

    if (documentType) {
      queryBuilder = queryBuilder.eq('document_type', documentType);
    }

    const { data, error } = await queryBuilder
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error searching medical references:', error);
      return [];
    }
    return data || [];
  },

  async getByTags(tags: string[]): Promise<MedicalReference[]> {
    const { data, error } = await supabase
      .from('medical_references')
      .select('*')
      .eq('is_active', true)
      .overlaps('tags', tags)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching references by tags:', error);
      return [];
    }
    return data || [];
  },

  async getByType(documentType: string): Promise<MedicalReference[]> {
    const { data, error } = await supabase
      .from('medical_references')
      .select('*')
      .eq('document_type', documentType)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching references by type:', error);
      return [];
    }
    return data || [];
  }
};

// Vector Search Service (for RAG)
export const vectorSearchService = {
  async searchDocuments(
    queryEmbedding: number[],
    matchThreshold = 0.78,
    matchCount = 10
  ) {
    const { data, error } = await supabase
      .rpc('search_medical_documents', {
        query_embedding: JSON.stringify(queryEmbedding),
        match_threshold: matchThreshold,
        match_count: matchCount
      });

    if (error) {
      console.error('Error searching documents with vector:', error);
      return [];
    }
    return data || [];
  }
};

// Authentication Services
export const authService = {
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }
    return user;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      return false;
    }
    return true;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}; 