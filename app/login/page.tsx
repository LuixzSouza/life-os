import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isSystemInstalled } from "@/lib/db-config";
import LoginPageClient from "@/components/login/LoginPageClient"; 

export default async function LoginPage() {
    // 1. Verifica arquivo de configuração (sistema instalado?)
    if (!isSystemInstalled()) {
        redirect("/setup");
    }

    let userCount = 0;

    try {
        // 2. Tenta apenas buscar os dados dentro do try
        userCount = await prisma.user.count();
    } catch (error) {
        // Erro REAL de banco (travado, timeout, conexão recusada). NÃO mandar
        // para o /setup: o banco existe e tem dados — o setup convidaria a criar
        // um admin novo por cima. Cai no app/error.tsx ("Tentar novamente").
        console.error("Erro crítico ao acessar banco de dados:", error);
        throw new Error("Banco de dados indisponível no momento.");
    }

    // 3. Verificação de Lógica de Negócio (FORA do try/catch)
    // Se não tem usuários, manda criar o Admin.
    if (userCount === 0) {
         redirect("/setup"); 
    }

    // 4. Se passou por tudo, exibe o login
    return <LoginPageClient />;
}