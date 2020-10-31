import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import * as Yup from 'yup';
import Orphanage from '../models/Orphanages';
import orphanages_view from '../views/orphanages_view';

export default {
  async index(request: Request, response: Response) {
    const orphanagesRepository = getRepository(Orphanage);

    const orphanages = await orphanagesRepository.find({
      relations: ['images'],
    });

    return response.status(200).json(orphanages_view.renderMany(orphanages));
  },

  async show(request: Request, response: Response) {
    const { id } = request.params;

    // get repository
    const orphanagesRepository = getRepository(Orphanage);
    // find one orphanage by id
    const orphanage = await orphanagesRepository.findOneOrFail(id, {
      relations: ['images'],
    });

    return response.status(200).json(orphanages_view.render(orphanage));
  },

  async create(
    request: Request,
    response: Response
  ): Promise<Response<Orphanage>> {
    const {
      name,
      latitude,
      longitude,
      about,
      instructions,
      opening_hours,
      open_on_weekends,
    } = request.body;

    // repositories
    const orphanagesRepository = getRepository(Orphanage);

    const requestImages = request.files as Express.Multer.File[];
    const images = requestImages.map((image) => {
      return { path: image.filename };
    });

    const data = {
      name,
      latitude,
      longitude,
      about,
      instructions,
      opening_hours,
      open_on_weekends,
      images,
    };

    const schema = Yup.object().shape({
      name: Yup.string().required(),
      latitude: Yup.number().required(),
      longitude: Yup.number().required(),
      about: Yup.string().required().max(300),
      instructions: Yup.string().required(),
      opening_hours: Yup.string().required(),
      open_on_weekends: Yup.boolean().required(),
      images: Yup.array(
        Yup.object().shape({
          path: Yup.string().required(),
        })
      ),
    });

    data['open_on_weekends'] = Yup.boolean().cast(data['open_on_weekends']);

    await schema.validate(data, {
      abortEarly: false,
    });


    // create orphanage
    const orphanage = orphanagesRepository.create(data);

    // save created orphanage
    const orphanageCreated = await orphanagesRepository.save(orphanage);

    return response.status(201).json(orphanages_view.render(orphanageCreated));
  },
};
