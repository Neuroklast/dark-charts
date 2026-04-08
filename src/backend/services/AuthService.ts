import prisma from '../lib/prisma'
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
    // Admins must only be created via the init-admin endpoint using environment variables.
    if (userData.role === 'ADMIN') {
      throw new Error('Admin registration is not allowed')
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    const passwordHash = await bcrypt.hash(userData.password, 10)

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash,
        role: userData.role
      }
    })

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
    const user = await prisma.user.findUnique({
      where: { email: credentials.email }
    })

    if (!user || !user.passwordHash) {
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
    } catch (error) {
      return null
    }
  }

  /**
   * Create the initial admin user from environment variables.
   * This bypasses the normal registration flow and is only called from init-admin endpoint.
   */
  async registerAdmin(email: string, password: string): Promise<AuthResult> {
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, passwordHash, role: 'ADMIN' }
    })

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
        await prisma.fanProfile.create({
          data: {
            userId,
            nickname: profileData?.nickname || 'Anonymous Fan',
            credits: 150
          }
        })
        break

      case 'DJ':
        await prisma.dJProfile.create({
          data: {
            userId,
            bio: profileData?.bio,
            soundcloudLink: profileData?.soundcloudLink,
            expertStatus: false,
            reputationScore: 0
          }
        })
        break

      case 'BAND':
        if (!profileData?.artistId) {
          throw new Error('Artist ID is required for band profiles')
        }
        await prisma.bandProfile.create({
          data: {
            userId,
            artistId: profileData.artistId,
            members: []
          }
        })
        break

      case 'LABEL':
        await prisma.labelProfile.create({
          data: {
            userId,
            companyName: profileData?.companyName || 'Unnamed Label',
            website: profileData?.website
          }
        })
        break

      default:
        break
    }
  }
}

export const authService = new AuthService()
