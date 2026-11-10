from fastapi import APIRouter, Depends, Response, status

from app.auth import Usuario, get_usuario_atual
from app.services import conta_service


router = APIRouter(prefix="/conta", tags=["Conta"])


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def excluir_conta(usuario: Usuario = Depends(get_usuario_atual)):
    """Apaga todos os dados do usuario na plataforma. O cliente exclui a conta do Cognito em seguida."""
    conta_service.excluir_dados_do_usuario(usuario.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
