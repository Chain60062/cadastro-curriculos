BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Candidates] (
    [id] INT NOT NULL IDENTITY(1,1),
    [fullName] NVARCHAR(150) NOT NULL,
    [email] NVARCHAR(254) NOT NULL,
    [phone] NVARCHAR(30),
    [desiredRole] NVARCHAR(120),
    [summary] NVARCHAR(4000),
    [source] VARCHAR(10) NOT NULL CONSTRAINT [Candidates_source_df] DEFAULT 'manual',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Candidates_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Candidates_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Candidates_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Candidates_createdAt_idx] ON [dbo].[Candidates]([createdAt]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
