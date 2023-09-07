// import { PairId } from '../id/id';
import { PairId } from '../id/id';
import { Pair } from './pair';

export interface IPairRepository {
  findAll(): Promise<Pair[]>;
  findById(pairId: PairId): Promise<Pair>;
  // findByIds(pairIds: PairId[]): Promise<Pair[]>;
  register(pair: Pair): Promise<void>;
  // update(pair: Pair): Promise<void>;
  // delete(pair: Pair): Promise<void>;
}
