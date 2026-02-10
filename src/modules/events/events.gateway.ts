import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '@core/redis/redis.module'; // Usa tu Alias
import Redis from 'ioredis';

@WebSocketGateway({
  cors: { origin: '*' }, // En producción, pon aquí la URL de tu frontend
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  // Cuando alguien entra a la app
  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  // Cuando alguien cierra la app
  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
    // Opcional: Aquí podrías liberar los bloqueos que ese usuario tenía
  }

  // --- EVENTO 1: BLOQUEAR MESA (Request Lock) ---
  @SubscribeMessage('client:request_lock')
  async handleLockRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tableId: string; userId: string },
  ) {
    const lockKey = `lock:table:${data.tableId}`;
    
    // 1. Intentar obtener el bloqueo en Redis
    // "SET NX" significa: Solo guárdalo si NO existe ya.
    // "EX 600" significa: Bórralo automáticamente en 600 segundos (10 min).
    const isLocked = await this.redis.set(lockKey, data.userId, 'EX', 600, 'NX');

    if (isLocked === 'OK') {
      // ÉXITO: Nadie la tenía, ahora es mía.
      // Avisamos a TODOS (incluyéndome) que la mesa está ocupada
      this.server.emit('server:table_locked', {
        tableId: data.tableId,
        userId: data.userId,
      });
      return { status: 'success' };
    } else {
      // FALLO: Alguien más ya la tiene.
      return { status: 'error', message: 'Mesa ya bloqueada' };
    }
  }

  // --- EVENTO 2: LIBERAR MESA (Release Lock) ---
  @SubscribeMessage('client:release_lock')
  async handleReleaseLock(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tableId: string; userId: string },
  ) {
    const lockKey = `lock:table:${data.tableId}`;
    
    // Validar que soy el dueño del bloqueo antes de borrarlo
    const currentOwner = await this.redis.get(lockKey);
    
    if (currentOwner === data.userId) {
      await this.redis.del(lockKey);
      
      // Avisamos a TODOS que la mesa está libre
      this.server.emit('server:table_released', { tableId: data.tableId });
      return { status: 'success' };
    }
    
    return { status: 'error', message: 'No eres el dueño del bloqueo' };
  }
}