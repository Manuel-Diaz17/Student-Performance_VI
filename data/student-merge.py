import pandas as pd

# Carregar os dados e adicionar a coluna 'course'
d1 = pd.read_csv("student-mat.csv", sep=";")
d1["course"] = "mat"  # Adicionar coluna para identificar o curso

d2 = pd.read_csv("student-por.csv", sep=";")
d2["course"] = "por"  # Adicionar coluna para identificar o curso

# Combinar os dois datasets
combined = pd.concat([d1, d2], ignore_index=True)

# Salvar o dataset combinado em um novo arquivo CSV
combined.to_csv("student-merge.csv", index=False, sep=";")

print("Novo dataset criado com sucesso: student_merge.csv")