import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';

@Injectable()
export class PokemonService {
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
  ) {}

  async create(createPokemonDto: CreatePokemonDto): Promise<Pokemon> {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase().trim();
    try {
      return await this.pokemonModel.create(createPokemonDto);
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  findAll(): string {
    return `This action returns all pokemon`;
  }

  async findOne(term: string): Promise<Pokemon> {
    let pokemon: Pokemon | null = null;

    // Búsqueda por número
    if (!isNaN(+term)) {
      pokemon = await this.pokemonModel.findOne({ no: +term });
    }

    // Búsqueda por MongoID
    if (!pokemon && isValidObjectId(term)) {
      pokemon = await this.pokemonModel.findById(term);
    }

    // Búsqueda por nombre
    if (!pokemon) {
      pokemon = await this.pokemonModel.findOne({
        name: term.toLowerCase().trim(),
      });
    }

    if (!pokemon) {
      throw new NotFoundException(
        `Pokemon with id, name or no "${term}" not found`,
      );
    }

    return pokemon;
  }

  async update(
    term: string,
    updatePokemonDto: UpdatePokemonDto,
  ): Promise <Pokemon> {
    const pokemon = await this.findOne(term);

    // Normalizar nombre
    if (updatePokemonDto.name) {
      updatePokemonDto.name = updatePokemonDto.name
        .toLowerCase()
        .trim();
    }

    try {
      const updatedPokemon = await this.pokemonModel.findByIdAndUpdate(
        {_id:pokemon._id}, 
          updatePokemonDto, 
          { new: true } // devolvemos el pokemon actualizado
        ); 

        if(!updatedPokemon) {
          throw new NotFoundException(`Pokemon with id "${term}" not found`);
        }

        return updatedPokemon;

    } catch (error: any) {
      if (error.code === 11000) {
        throw new BadRequestException(
          `Pokemon exists in db ${JSON.stringify(error.keyValue)}`,
        );
      }
      throw new InternalServerErrorException(
        `Can't update Pokemon - Check server logs`,
      );
    }
  }

  async remove(id: string): Promise<void> {
    const { deletedCount } = await this.pokemonModel.deleteOne({ _id: id });
    if (deletedCount === 0) {
      throw new NotFoundException(`Pokemon with id "${id}" not found`);
    }
  }

  private handleExceptions(error: any): never {
    if (error.code === 11000) {
      throw new BadRequestException(
        `Pokemon exists in db ${JSON.stringify(error.keyValue)}`,
      );
    }
    console.error(error);
    throw new InternalServerErrorException(
      `Can't create Pokemon - Check server logs`,
    );
  }
}