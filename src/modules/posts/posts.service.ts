import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Post } from './entities/post.entity';
import { Category } from './entities/category.entity';
import { Tag } from './entities/tag.entity';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';
import { PostFilterInput, PaginationInput, PaginatedPosts } from './dto/post-filter.input';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    private readonly dataSource: DataSource,
  ) {}

  private slugify(title: string): string {
    return (
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') +
      '-' +
      Math.floor(1000 + Math.random() * 9000)
    );
  }

  async findPaginated(
    filter?: PostFilterInput,
    pagination?: PaginationInput,
  ): Promise<PaginatedPosts> {
    const skip = pagination?.skip ?? 0;
    const take = pagination?.take ?? 10;

    const qb = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.categories', 'category')
      .leftJoinAndSelect('post.tags', 'tag');

    if (filter?.search) {
      qb.andWhere(
        '(LOWER(post.title) LIKE LOWER(:search) OR LOWER(post.content) LIKE LOWER(:search))',
        { search: `%${filter.search}%` },
      );
    }

    if (filter?.published !== undefined) {
      qb.andWhere('post.published = :published', { published: filter.published });
    }

    if (filter?.authorId) {
      qb.andWhere('post.authorId = :authorId', { authorId: filter.authorId });
    }

    if (filter?.categoryId) {
      qb.andWhere('category.id = :categoryId', { categoryId: filter.categoryId });
    }

    if (filter?.tagName) {
      qb.andWhere('LOWER(tag.name) = LOWER(:tagName)', { tagName: filter.tagName });
    }

    qb.orderBy('post.createdAt', 'DESC').skip(skip).take(take);

    const [items, totalCount] = await qb.getManyAndCount();

    return {
      items,
      totalCount,
      skip,
      take,
      hasMore: skip + items.length < totalCount,
    };
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['author', 'categories', 'tags', 'comments'],
    });
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return post;
  }

  async create(createPostInput: CreatePostInput): Promise<Post> {
    const { categoryIds, tagNames, ...rest } = createPostInput;

    const categories = categoryIds?.length
      ? await this.categoryRepository.findBy({ id: In(categoryIds) })
      : [];

    const tags: Tag[] = [];
    if (tagNames?.length) {
      for (const name of tagNames) {
        let tag = await this.tagRepository.findOne({ where: { name } });
        if (!tag) {
          tag = this.tagRepository.create({ name });
          await this.tagRepository.save(tag);
        }
        tags.push(tag);
      }
    }

    const post = this.postRepository.create({
      ...rest,
      slug: this.slugify(rest.title),
      categories,
      tags,
    });

    return this.postRepository.save(post);
  }

  async incrementViews(id: string): Promise<Post> {
    await this.postRepository.increment({ id }, 'views', 1);
    return this.findOne(id);
  }

  async update(updatePostInput: UpdatePostInput): Promise<Post> {
    const post = await this.findOne(updatePostInput.id);
    const { categoryIds, tagNames, ...rest } = updatePostInput;

    if (rest.title && rest.title !== post.title) {
      post.slug = this.slugify(rest.title);
    }

    Object.assign(post, rest);

    if (categoryIds !== undefined) {
      post.categories = categoryIds.length
        ? await this.categoryRepository.findBy({ id: In(categoryIds) })
        : [];
    }

    if (tagNames !== undefined) {
      const tags: Tag[] = [];
      for (const name of tagNames) {
        let tag = await this.tagRepository.findOne({ where: { name } });
        if (!tag) {
          tag = this.tagRepository.create({ name });
          await this.tagRepository.save(tag);
        }
        tags.push(tag);
      }
      post.tags = tags;
    }

    return this.postRepository.save(post);
  }

  async remove(id: string): Promise<boolean> {
    const post = await this.findOne(id);
    await this.postRepository.remove(post);
    return true;
  }
}
