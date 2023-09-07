import { PrismaClient } from '@prisma/client';
import { IParticipantRepository } from '../../../domain/participant/participant-repository';
import { Participant } from '../../../domain/participant/participant';
import { ParticipantId } from '../../../domain/id/id';
import { Email } from '../../../domain/email/email';
import { ParticipantStatus } from '../../../domain/participant/participant-status';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ParticipantRepository implements IParticipantRepository {
  private prismaClient: PrismaClient;
  public constructor() {
    this.prismaClient = new PrismaClient();
  }

  private statusTextToStatusEnum(statusText: string): ParticipantStatus {
    switch (statusText) {
      case 'ACTIVE':
        return ParticipantStatus.ACTIVE;
      case 'STAY_AWAY':
        return ParticipantStatus.STAY_AWAY;
      case 'RESIGNED':
        return ParticipantStatus.RESIGNED;
      default:
        throw new Error(`Invalid status text. given: ${statusText}`);
    }
  }

  public async findAll(): Promise<Participant[]> {
    const allParticipants = await this.prismaClient.participant.findMany();
    const participantStatuses =
      await this.prismaClient.participantStatus.findMany({
        where: {
          id: {
            in: allParticipants.map((participant) => participant.statusId),
          },
        },
      });

    return allParticipants.map((participant) => {
      const participantStatus = participantStatuses.find(
        (participantStatus) => participantStatus.id === participant.statusId,
      );

      if (!participantStatus) {
        throw new Error(`ParticipantStatus not found. id: ${participant.id}`);
      }

      return Participant.reconstruct({
        id: new ParticipantId(participant.id),
        name: participant.name,
        email: new Email(participant.email),
        status: this.statusTextToStatusEnum(participantStatus.name),
      });
    });
  }

  public async findById(id: ParticipantId): Promise<Participant | null> {
    const participant = await this.prismaClient.participant.findFirstOrThrow({
      where: {
        id: id.value,
      },
    });

    const participantStatus =
      await this.prismaClient.participantStatus.findFirstOrThrow({
        where: {
          id: participant.statusId,
        },
      });

    return Participant.reconstruct({
      id: new ParticipantId(participant.id),
      name: participant.name,
      email: new Email(participant.email),
      status: this.statusTextToStatusEnum(participantStatus.name),
    });
  }

  public async findByIds(ids: ParticipantId[]): Promise<Participant[]> {
    const participants = await this.prismaClient.participant.findMany({
      where: {
        id: {
          in: ids.map((id) => id.value),
        },
      },
    });

    const participantStatuses =
      await this.prismaClient.participantStatus.findMany({
        where: {
          id: {
            in: participants.map((participant) => participant.statusId),
          },
        },
      });

    return participants.map((participant) => {
      const participantStatus = participantStatuses.find(
        (participantStatus) => participantStatus.id === participant.statusId,
      );

      if (!participantStatus) {
        throw new Error(`ParticipantStatus not found. id: ${participant.id}`);
      }

      return Participant.reconstruct({
        id: new ParticipantId(participant.id),
        name: participant.name,
        email: new Email(participant.email),
        status: this.statusTextToStatusEnum(participantStatus.name),
      });
    });
  }

  public async findByEmail(email: Email): Promise<Participant | null> {
    const participant = await this.prismaClient.participant.findFirst({
      where: {
        email: email.value,
      },
    });

    if (!participant) {
      return null;
    }

    const participantStatus =
      await this.prismaClient.participantStatus.findFirstOrThrow({
        where: {
          id: participant.statusId,
        },
      });

    return Participant.reconstruct({
      id: new ParticipantId(participant.id),
      name: participant.name,
      email: new Email(participant.email),
      status: this.statusTextToStatusEnum(participantStatus.name),
    });
  }

  public async save({ id, name, email, status }: Participant): Promise<void> {
    const participantStatus =
      await this.prismaClient.participantStatus.findFirstOrThrow({
        where: {
          name: status,
        },
      });

    const values = {
      name: name,
      email: email.value,
      statusId: participantStatus.id,
    } as const;

    await this.prismaClient.participant.upsert({
      where: {
        id: id.value,
      },
      update: values,
      create: { ...values, id: id.value },
    });
  }
}
