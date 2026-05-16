import { supabase } from '@/lib/supabase/client'
// @ts-ignore - optional server dependency
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable must be set')
}
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = '7d'

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
  async register(userData: RegisterUserData): Promise<AuthResult> {
    if (userData.role === 'ADMIN') {
      throw new Error('Admin registration is not allowed.')
    }

    const { data: existingUser } = await supabase.from('users').select('id').eq('email', userData.email).maybeSingle()
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

    await this.createRoleProfile(user.id, userData.role, userData.profileData)

    const token = this.generateToken(user.id, user.email, user.role)

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', credentials.email)
      .maybeSingle()

    if (error || !user || !user.passwordHash) {
      throw new Error('Invalid credentials')
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
        role: user.role
      }
    }
  }

  async verifyToken(token: string): Promise<{ userId: string; email: string; role: string; isDemo?: boolean } | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
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
    const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).maybeSingle()
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

  private generateToken(userId: string, email: string, role: string, isDemo?: boolean): string {
    return jwt.sign(
      { userId, email, role, ...(isDemo ? { isDemo: true } : {}) },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )
  }

  private async createRoleProfile(
    userId: string,
    role: string,
    profileData?: RegisterUserData['profileData']
  ): Promise<void> {
    switch (role) {
      case 'FAN':
        await supabase.from('fan_profiles').insert({
          userId,
          nickname: profileData?.nickname || 'Anonymous Fan',
          credits: 150,
          remainingCredits: 150,
        })
        break

      case 'DJ':
        await supabase.from('dj_profiles').insert({
          userId,
          bio: profileData?.bio ?? null,
          soundcloudLink: profileData?.soundcloudLink ?? null,
          expertStatus: false,
          reputationScore: 0,
        })
        break

      case 'BAND':
        if (!profileData?.artistId) {
          throw new Error('Artist ID is required for band profiles')
        }
        await supabase.from('band_profiles').insert({
          userId,
          artistId: profileData.artistId,
          members: [],
        })
        break

      case 'LABEL':
        await supabase.from('label_profiles').insert({
          userId,
          companyName: profileData?.companyName || 'Unnamed Label',
          website: profileData?.website ?? null,
        })
        break

      default:
        break
    }
  }
}

export const authService = new AuthService()
