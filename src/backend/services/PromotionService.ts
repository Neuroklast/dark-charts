import { prisma } from '../lib/prisma';

export class PromotionService {
  async getActivePromotions() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeBookings = await prisma.booking.findMany({
      where: {
        status: 'PAID',
        slotDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        user: {
          include: {
            bandProfile: {
              include: {
                artist: true,
              },
            },
            djProfile: true,
            fanProfile: true,
          },
        },
      },
    });

    return activeBookings.map((booking) => {
      let imageUrl = null;
      let name = null;
      let label = booking.slotType;

      if (booking.user.bandProfile?.artist) {
        imageUrl = booking.user.bandProfile.artist.imageUrl;
        name = booking.user.bandProfile.artist.name;
      } else if (booking.user.djProfile) {
        imageUrl = null; // No avatar on DJProfile right now? Let's check schema.
        name = 'DJ Promotion'; // We'd need to join to user or user.name, but user only has email.
      } else if (booking.user.fanProfile) {
        imageUrl = booking.user.fanProfile.avatarUrl;
        name = booking.user.fanProfile.nickname;
      }

      return {
        id: booking.id,
        type: booking.slotType,
        imageUrl,
        name,
        label,
      };
    });
  }
}

export const promotionService = new PromotionService();
