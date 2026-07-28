  // ─── LECTURES ─────────────────────────────────────────────────────────────
  async findAll(dto: FindAllAbsencesDto) {
    const where: any = {};
    if (dto.userId) where.userId = dto.userId;
    if (dto.mois) where.mois = dto.mois;
    if (dto.annee) where.annee = dto.annee;

    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.absence.findMany({
        where,
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true } } },
        orderBy: [{ annee: 'desc' }, { mois: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.absence.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(dto: FindOneAbsenceDto) {
    const { userId, mois, annee } = dto;

    const absence = await this.prisma.absence.findUnique({
      where: { userId_mois_annee: { userId, mois, annee } },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true } } },
    });

    if (!absence) {
      const codeMois = String(mois).padStart(2, '0');
      throw new NotFoundException(`Aucune absence pour cet employé en ${codeMois}/${annee}.`);
    }

    return absence;
  }
