import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { SupabaseClient } from '@supabase/supabase-js'

type AuthSupabaseClient = SupabaseClient<any, 'public', any>

const JWT_EXPIRES_IN = '7d'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable must be set')
  }
  return secret
}

export interface RegisterUserData {
  email: string
  password: string
  role: 'ADMIN' | 'LABEL' | 'BAND' | 'DJ' | 'FAN'
  profileData?: {
    nickname?: string
    bio?: string
    soundcloudLink?: string
    artistId?: string
    companyName?: string
    website?: string
  }
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResult {
  token: string
  user: {
    id: string
    email: string
    role: string
  }
}

export class AuthService {
  private supabasePromise: Promise<AuthSupabaseClient> | null = null

  private async getSupabase(): Promise<AuthSupabaseClient> {
    if (!this.supabasePromise) {
      this.supabasePromise = import('@/lib/supabase/server').then(
        ({ createServiceRoleSupabaseClient }) =>
          createServiceRoleSupabaseClient()
      )
    }
    return this.supabasePromise
  }

  async register(userData: RegisterUserData): Promise<AuthResult> {
    if (userData.role === 'ADMIN') {
      throw new Error('Admin registration is not allowed.')
    }

    const supabase = await this.getSupabase()

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .maybeSingle()
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    const passwordHash = await bcrypt.hash(userData.password, 10)
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: userData.email,
        passwordHash,
        role: userData.role,
      })
      .select()
      .single()

    if (error || !user) {
      throw new Error(error?.message || 'Failed to create user')
    }

    await this.createRoleProfile(
      supabase,
      user.id,
      userData.role,
      userData.profileData
    )

    const token = this.generateToken(user.id, user.email, user.role)

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    }
  }

  async loginOrRegisterOAuth(data: {
    email: string
    name: string
    provider: 'spotify' | 'google'
    providerId: string
  }): Promise<AuthResult> {
    const supabase = await this.getSupabase()

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', data.email)
      .maybeSingle()

    if (existingUser?.isSuspended) {
      throw new Error('Account suspended')
    }

    if (existingUser) {
      const token = this.generateToken(
        existingUser.id,
        existingUser.email,
        existingUser.role
      )
      return {
        token,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          role: existingUser.role,
        },
      }
    }

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: data.email,
        passwordHash: null,
        role: 'FAN',
      })
      .select()
      .single()

    if (error || !user) {
      throw new Error(error?.message || 'Failed to create user')
    }

    await this.createRoleProfile(supabase, user.id, 'FAN', {
      nickname: data.name || `OAuth-${data.provider}`,
    })

    const token = this.generateToken(user.id, user.email, user.role)
    return {
      token,
      user: { id: user.id, email: user.email, role: user.role },
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const supabase = await this.getSupabase()

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', credentials.email)
      .maybeSingle()

    if (error || !user || !user.passwordHash) {
      throw new Error('Invalid credentials')
    }

    if (user.isSuspended) {
      throw new Error('Account suspended')
    }

    const isPasswordValid = await bcrypt.compare(
      credentials.password,
      user.passwordHash
    )

    if (!isPasswordValid) {
      throw new Error('Invalid credentials')
    }

    const token = this.generateToken(user.id, user.email, user.role)

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    }
  }

  async verifyToken(
    token: string
  ): Promise<{ userId: string; email: string; role: string; isDemo?: boolean } | null> {
    try {
      const decoded = jwt.verify(token, getJwtSecret()) as {
        userId: string
        email: string
        role: string
        isDemo?: boolean
      }

      return decoded
    } catch {
      return null
    }
  }

  async registerAdmin(email: string, password: string): Promise<AuthResult> {
    const supabase = await this.getSupabase()

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const { data: user, error } = await supabase
      .from('users')
      .insert({ email, passwordHash, role: 'ADMIN' })
      .select()
      .single()

    if (error || !user) {
      throw new Error(error?.message || 'Failed to create admin user')
    }

    const token = this.generateToken(user.id, user.email, user.role)
    return { token, user: { id: user.id, email: user.email, role: user.role } }
  }

  private generateToken(
    userId: string,
    email: string,
    role: string,
    isDemo?: boolean
  ): string {
    return jwt.sign(
      { userId, email, role, ...(isDemo ? { isDemo: true } : {}) },
      getJwtSecret(),
      { expiresIn: JWT_EXPIRES_IN }
    )
  }

  private async createRoleProfile(
    supabase: AuthSupabaseClient,
    userId: string,
    role: string,
    profileData?: RegisterUserData['profileData']
  ): Promise<void> {
    switch (role) {
      case 'FAN': {
        const { error } = await supabase.from('fan_profiles').insert({
          userId,
          nickname: profileData?.nickname || 'Anonymous Fan',
          credits: 150,
          remainingCredits: 150,
        })
        if (error) {
          throw new Error(error.message)
        }
        break
      }

      case 'DJ': {
        const { error } = await supabase.from('dj_profiles').insert({
          userId,
          bio: profileData?.bio ?? null,
          soundcloudLink: profileData?.soundcloudLink ?? null,
          expertStatus: false,
          reputationScore: 0,
        })
        if (error) {
          throw new Error(error.message)
        }
        break
      }

      case 'BAND': {
        if (!profileData?.artistId) {
          throw new Error('Artist ID is required for band profiles')
        }
        const { error } = await supabase.from('band_profiles').insert({
          userId,
          artistId: profileData.artistId,
          members: [],
        })
        if (error) {
          throw new Error(error.message)
        }
        break
      }

      case 'LABEL': {
        const { error } = await supabase.from('label_profiles').insert({
          userId,
          companyName: profileData?.companyName || 'Unnamed Label',
          website: profileData?.website ?? null,
        })
        if (error) {
          throw new Error(error.message)
        }
        break
      }

      default:
        break
    }
  }
}

export const authService = new AuthService()